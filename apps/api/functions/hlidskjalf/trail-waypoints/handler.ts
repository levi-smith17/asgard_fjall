import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { GREIN_PREFIX, SOGUR_PREFIX } from '../../shared/keys'
import { filterLaufar, parseLaufFilterParams, sortLaufar } from '../../shared/lauf-filters'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

const DEFAULT_PAGE_SIZE = 5

type EmbeddedRun = { id: string; name: string; color: string; icon?: string | null }

function trailIdFrom(item: Record<string, unknown>): string | null {
  const greinId = item.greinId ?? item.trailId
  return greinId != null ? String(greinId) : null
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const qs = event.queryStringParameters ?? {}
    const trailId = qs.trailId
    if (!trailId) return toApiGatewayResponse(badRequest('trailId is required'))

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
          ExpressionAttributeValues: { ':gsi1pk': `${GREIN_PREFIX}${trailId}` },
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

    const rawWaypoints = (laufarResult.Items ?? []).filter(
      (w) => w.pk === `USER#${userId}`,
    )

    const logsByWaypoint = new Map<string, { id: string; content: string; createdAt: string }[]>()
    for (const log of sogurResult.Items ?? []) {
      if (!log.waypointId) continue
      const waypointId = String(log.waypointId)
      if (!logsByWaypoint.has(waypointId)) logsByWaypoint.set(waypointId, [])
      logsByWaypoint.get(waypointId)!.push({
        id: String(log.sk).split('#').pop()!,
        content: String(log.content ?? ''),
        createdAt: log.createdAt as string,
      })
    }

    let waypoints = rawWaypoints.map((w) => {
      const id = String(w.sk).split('#').pop() as string
      const runir = ((w.runir ?? w.markers) as EmbeddedRun[] | undefined) ?? []
      return {
        id,
        title: w.title as string,
        url: w.url as string,
        favicon: (w.favicon as string | null) ?? null,
        read: (w.read as boolean) ?? false,
        readLater: (w.readLater as boolean) ?? false,
        trailId: trailIdFrom(w),
        markers: runir.map((m) => ({
          markerId: m.id,
          marker: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
        })),
        createdAt: w.createdAt as string,
        logs: (logsByWaypoint.get(id) ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1),
      }
    })

    waypoints = sortLaufar(filterLaufar(waypoints, filterParams), filterParams.sort)

    const filteredCount = waypoints.length
    const skip = (page - 1) * pageSize
    const paged = waypoints.slice(skip, skip + pageSize)

    return toApiGatewayResponse(ok({ waypoints: paged, filteredCount }))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
