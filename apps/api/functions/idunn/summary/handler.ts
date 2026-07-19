import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { SURTR_PREFIX, IDUNN_PREFIX, SKATT_PREFIX } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

type BillingCycle = 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY'

function normalizeToMonthly(amount: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case 'WEEKLY':
      return (amount * 52) / 12
    case 'BIWEEKLY':
      return (amount * 26) / 12
    case 'MONTHLY':
      return amount
    case 'QUARTERLY':
      return amount / 3
    case 'ANNUALLY':
      return amount / 12
  }
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const params = event.queryStringParameters ?? {}

    if (!params.month || !params.year) {
      return toApiGatewayResponse(badRequest('month and year are required'))
    }

    const month = parseInt(params.month, 10)
    const year = parseInt(params.year, 10)

    if (isNaN(month) || isNaN(year)) {
      return toApiGatewayResponse(badRequest('month and year must be numbers'))
    }

    const pk = getPk(event)

    const [idunnResult, surtrResult, skattResult] = await Promise.all([
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': IDUNN_PREFIX },
        }),
      ),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': SURTR_PREFIX },
        }),
      ),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': SKATT_PREFIX },
        }),
      ),
    ])

    const idunn = idunnResult.Items ?? []
    const surtrItems = surtrResult.Items ?? []
    const skattItems = skattResult.Items ?? []

    const activeIdunn = idunn.filter((s) => s.active)

    const monthlyIdunnCost = activeIdunn.reduce(
      (sum, s) => sum + normalizeToMonthly(s.amount as number, s.billingCycle as BillingCycle),
      0,
    )

    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`
    const monthSurtr = surtrItems.filter((b) => String(b.date).startsWith(monthPrefix))
    const totalSurtr = monthSurtr.reduce((sum, b) => sum + (b.amount as number), 0)
    const totalMonthSpend = monthlyIdunnCost + totalSurtr

    const now = new Date()
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingRenewals = activeIdunn
      .filter((s) => {
        const renewal = new Date(s.nextRenewal as string)
        return renewal >= now && renewal <= sevenDaysOut
      })
      .sort((a, b) => new Date(a.nextRenewal as string).getTime() - new Date(b.nextRenewal as string).getTime())
      .map((s) => ({
        id: String(s.sk).split('#').pop(),
        name: s.name,
        amount: s.amount,
        nextRenewal: s.nextRenewal,
        billingCycle: s.billingCycle,
      }))

    const monthSkatt = skattItems.filter((c) => {
      const parts = String(c.sk).split('#')
      return parts[2] === String(month) && parts[3] === String(year)
    })

    const runMap = await resolveRunirById(
      pk,
      monthSkatt.map((c) => String(c.sk).split('#')[1]),
    )

    const skattUtilization = monthSkatt.map((c) => {
      const parts = String(c.sk).split('#')
      const runId = parts[1]
      const resolved = runMap.get(runId as string)
      const spent = monthSurtr
        .filter((b) => (b.runir ?? []).some((m: { id?: string }) => m.id === runId))
        .reduce((sum, b) => sum + (b.amount as number), 0)
      const limit = c.limit as number
      const utilization = limit > 0 ? (spent / limit) * 100 : 0
      return {
        id: c.id ?? String(c.sk).replace(new RegExp(`^${SKATT_PREFIX}`), ''),
        runId,
        run: {
          id: runId,
          name: c.runName || resolved?.name || 'Uncategorized',
          color: resolved?.color || '#6b7280',
        },
        limit: c.limit,
        spent,
        utilization,
        ...(c.fundId ? { fundId: c.fundId } : {}),
      }
    })

    return toApiGatewayResponse(
      ok({
        summary: {
          monthlySupplylineCost: monthlyIdunnCost,
          totalBurn: totalSurtr,
          totalMonthSpend,
          activeSupplylines: activeIdunn.length,
        },
        upcomingRenewals,
        cacheUtilization: skattUtilization,
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
