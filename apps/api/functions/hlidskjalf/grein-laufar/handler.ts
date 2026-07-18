import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { GREIN_PREFIX, SOGUR_PREFIX } from '../../shared/keys'
import { filterLaufar, parseLaufFilterParams, sortLaufar } from '../../shared/lauf-filters'
import { readEmbeddedRunir, readGreinId, readLaufId } from '../../shared/legacy-attrs'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

const DEFAULT_PAGE_SIZE = 5

type EmbeddedRun = { id: string; name: string; color: string; icon?: string | null }

function greinIdFrom(item: Record<string, unknown>): string | null {
  return readGreinId(item)
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const qs = event.queryStringParameters ?? {}
    const greinId = qs.greinId
    if (!greinId) return toApiGatewayResponse(badRequest('greinId is required'))

    const pk = getPk(event)
    const userId = getUserId(event)
    const page = Math.max(1, parseInt(qs.page ?? '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(qs.pageSize ?? String(DEFAULT_PAGE_SIZE), 10)))
    const filterParams = parseLaufFilterParams(qs)

    const [laufarResult, sogurResult] = await Promise.all([
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: 'gsi1',
          KeyConditionExpression: 'gsi1pk = :gsi1pk',
          ExpressionAttributeValues: { ':gsi1pk': `${GREIN_PREFIX}${greinId}` },
        }),
      ),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': SOGUR_PREFIX },
        }),
      ),
    ])

    const rawLaufar = (laufarResult.Items ?? []).filter(
      (w) => w.pk === `USER#${userId}`,
    )

    const logsByLauf = new Map<string, { id: string; content: string; createdAt: string }[]>()
    for (const log of sogurResult.Items ?? []) {
      const laufId = readLaufId(log)
      if (!laufId) continue
      if (!logsByLauf.has(laufId)) logsByLauf.set(laufId, [])
      logsByLauf.get(laufId)!.push({
        id: String(log.sk).split('#').pop()!,
        content: String(log.content ?? ''),
        createdAt: log.createdAt as string,
      })
    }

    let laufar = rawLaufar.map((w) => {
      const id = String(w.sk).split('#').pop() as string
      const runir = readEmbeddedRunir<EmbeddedRun>(w)
      return {
        id,
        title: w.title as string,
        url: w.url as string,
        favicon: (w.favicon as string | null) ?? null,
        read: (w.read as boolean) ?? false,
        readLater: (w.readLater as boolean) ?? false,
        greinId: greinIdFrom(w),
        runir: runir.map((m) => ({
          runId: m.id,
          run: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
        })),
        createdAt: w.createdAt as string,
        logs: (logsByLauf.get(id) ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1),
      }
    })

    laufar = sortLaufar(filterLaufar(laufar, filterParams), filterParams.sort)

    const filteredCount = laufar.length
    const skip = (page - 1) * pageSize
    const paged = laufar.slice(skip, skip + pageSize)

    return toApiGatewayResponse(ok({ laufar: paged, filteredCount }))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
