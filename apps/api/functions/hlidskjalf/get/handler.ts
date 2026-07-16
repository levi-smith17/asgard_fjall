import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { GREIN_PREFIX, LAUF_PREFIX, RUN_PREFIX, SOGUR_PREFIX } from '../../shared/keys'
import { filterLaufar, parseLaufFilterParams, sortLaufar } from '../../shared/lauf-filters'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

const PAGE_SIZE = 15
const LAUFAR_PER_GREIN = 5

function queryAll(pk: string, prefix: string) {
  return dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
    }),
  )
}

type EmbeddedRun = { id: string; name: string; color: string; icon?: string | null }

function toMarkerEntry(m: EmbeddedRun) {
  return {
    markerId: m.id,
    marker: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
  }
}

function embeddedRuns(item: Record<string, unknown>): EmbeddedRun[] {
  const runir = (item.runir ?? item.markers) as EmbeddedRun[] | undefined
  return runir ?? []
}

function trailIdFrom(item: Record<string, unknown>): string | null {
  const greinId = item.greinId ?? item.trailId
  return greinId != null ? String(greinId) : null
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)
    const qs = event.queryStringParameters ?? {}
    const page = Math.max(1, parseInt(qs.page ?? '1', 10))
    const filterParams = parseLaufFilterParams(qs)
    const filterTrailId = qs.trailId && qs.trailId !== 'all' ? qs.trailId : null
    const { search, markerIds, readLater, dateFrom, dateTo, sort } = filterParams

    const [greinarResult, laufarResult, runirResult, sogurResult] = await Promise.all([
      queryAll(pk, GREIN_PREFIX),
      queryAll(pk, LAUF_PREFIX),
      queryAll(pk, RUN_PREFIX),
      queryAll(pk, SOGUR_PREFIX),
    ])

    const rawTrails = (greinarResult.Items ?? []).map((t) => ({
      id: String(t.sk).split('#').pop() as string,
      name: t.name as string,
      createdAt: t.createdAt as string,
    }))

    const tags = (runirResult.Items ?? []).map((m) => ({
      id: String(m.sk).split('#').pop() as string,
      name: m.name,
      color: m.color,
      icon: m.icon ?? null,
    }))

    const allWaypointsByTrail = new Map<string, number>()
    for (const w of laufarResult.Items ?? []) {
      const tid = trailIdFrom(w)
      if (tid) allWaypointsByTrail.set(tid, (allWaypointsByTrail.get(tid) ?? 0) + 1)
    }

    let waypoints = (laufarResult.Items ?? []).map((w) => ({
      id: String(w.sk).split('#').pop() as string,
      title: w.title as string,
      url: w.url as string,
      favicon: w.favicon ?? null,
      read: w.read ?? false,
      readLater: w.readLater ?? false,
      trailId: trailIdFrom(w),
      markers: embeddedRuns(w).map(toMarkerEntry),
      createdAt: w.createdAt as string,
    }))

    waypoints = filterLaufar(waypoints, filterParams)
    if (filterTrailId) {
      waypoints = waypoints.filter((w) => w.trailId === filterTrailId)
    }

    waypoints = sortLaufar(waypoints, sort)

    const filteredWaypointsByTrail = new Map<string, typeof waypoints>()
    for (const w of waypoints) {
      const tid = w.trailId
      if (tid) {
        if (!filteredWaypointsByTrail.has(tid)) filteredWaypointsByTrail.set(tid, [])
        filteredWaypointsByTrail.get(tid)!.push(w)
      }
    }

    const allLogs = (sogurResult.Items ?? []).map((l) => ({
      id: String(l.sk).split('#').pop() as string,
      content: l.content as string,
      trailId: trailIdFrom(l),
      waypointId: l.waypointId != null ? String(l.waypointId) : null,
      markers: embeddedRuns(l).map(toMarkerEntry),
      createdAt: l.createdAt as string,
    }))

    const logCountByTrail = new Map<string, number>()
    const logsByWaypoint = new Map<string, typeof allLogs>()
    for (const log of allLogs) {
      if (log.trailId) {
        logCountByTrail.set(log.trailId, (logCountByTrail.get(log.trailId) ?? 0) + 1)
      }
      if (log.waypointId) {
        if (!logsByWaypoint.has(log.waypointId)) logsByWaypoint.set(log.waypointId, [])
        logsByWaypoint.get(log.waypointId)!.push(log)
      }
    }

    const hasWaypointFilter = !!(search || markerIds.length > 0 || readLater || dateFrom || dateTo)

    let activeTrails = rawTrails.filter((t) => {
      const hasFilteredWaypoints = (filteredWaypointsByTrail.get(t.id)?.length ?? 0) > 0
      const hasLogs = (logCountByTrail.get(t.id) ?? 0) > 0
      if (hasWaypointFilter) return hasFilteredWaypoints
      return hasFilteredWaypoints || hasLogs
    })

    if (filterTrailId) {
      activeTrails = activeTrails.filter((t) => t.id === filterTrailId)
    }

    if (sort === 'oldest') {
      activeTrails.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sort === 'newest') {
      activeTrails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      activeTrails.sort((a, b) => a.name.localeCompare(b.name))
    }

    const skip = (page - 1) * PAGE_SIZE
    const pageTrails = activeTrails.slice(skip, skip + PAGE_SIZE)
    const hasMore = skip + PAGE_SIZE < activeTrails.length

    const filteredCountMap: Record<string, number> = {}
    const folders = pageTrails.map((t) => {
      const trailWaypoints = filteredWaypointsByTrail.get(t.id) ?? []
      filteredCountMap[t.id] = trailWaypoints.length

      const topWaypoints = trailWaypoints.slice(0, LAUFAR_PER_GREIN).map((w) => ({
        ...w,
        logs: (logsByWaypoint.get(w.id) ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1),
      }))

      return {
        id: t.id,
        name: t.name,
        waypoints: topWaypoints,
        _count: {
          waypoints: allWaypointsByTrail.get(t.id) ?? 0,
          logs: logCountByTrail.get(t.id) ?? 0,
        },
      }
    })

    const allFolders = rawTrails.map((t) => ({ id: t.id, name: t.name }))

    return toApiGatewayResponse(
      ok({
        folders,
        hasMore,
        tags,
        allFolders,
        filteredCountMap,
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
