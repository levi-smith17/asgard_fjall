import { QueryCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { skattSk, SKATT_PREFIX } from '../../shared/keys'
import { readRunId } from '../../shared/legacy-attrs'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')

    if (body.month === undefined || body.year === undefined) {
      return toApiGatewayResponse(badRequest('month and year are required'))
    }

    const month: number = body.month
    const year: number = body.year

    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const pk = getPk(event)

    const [prevResult, currentResult] = await Promise.all([
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': SKATT_PREFIX },
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

    const prevBudgets = (prevResult.Items ?? []).filter((b) => {
      const parts = String(b.sk).split('#')
      return parts[2] === String(prevMonth) && parts[3] === String(prevYear)
    })

    const existingRunIds = new Set(
      (currentResult.Items ?? [])
        .filter((b) => {
          const parts = String(b.sk).split('#')
          return parts[2] === String(month) && parts[3] === String(year)
        })
        .map((b) => readRunId(b))
        .filter((id): id is string => id != null),
    )

    const toCreate = prevBudgets.filter((b) => {
      const id = readRunId(b)
      return id != null && !existingRunIds.has(id)
    })

    if (toCreate.length === 0) {
      return toApiGatewayResponse(ok({ count: 0 }))
    }

    const newItems = toCreate.map((b) => {
      const runId = readRunId(b)!
      return {
        pk,
        sk: skattSk(runId, month, year),
        id: randomUUID(),
        runId,
        runName: b.runName,
        limit: b.limit,
        month,
        year,
      }
    })

    const chunks: (typeof newItems)[] = []
    for (let i = 0; i < newItems.length; i += 25) {
      chunks.push(newItems.slice(i, i + 25))
    }

    await Promise.all(
      chunks.map((chunk) =>
        dynamo.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: chunk.map((item) => ({
                PutRequest: { Item: item },
              })),
            },
          }),
        ),
      ),
    )

    return toApiGatewayResponse(ok({ count: newItems.length }))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
