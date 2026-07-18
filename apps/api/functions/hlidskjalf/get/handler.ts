import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { GREIN_PREFIX, LAUF_PREFIX, RUN_PREFIX, SOGUR_PREFIX } from '../../shared/keys'
import { filterLaufar, parseLaufFilterParams, sortLaufar } from '../../shared/lauf-filters'
import { readEmbeddedRunir, readGreinId, readLaufId } from '../../shared/legacy-attrs'
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

function toRunEntry(m: EmbeddedRun) {
  return {
    runId: m.id,
    run: { id: m.id, name: m.name, color: m.color, icon: m.icon ?? null },
  }
}

function embeddedRuns(item: Record<string, unknown>): EmbeddedRun[] {
  return readEmbeddedRunir<EmbeddedRun>(item)
}

function greinIdFrom(item: Record<string, unknown>): string | null {
  return readGreinId(item)
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)
    const qs = event.queryStringParameters ?? {}
    const page = Math.max(1, parseInt(qs.page ?? '1', 10))
    const filterParams = parseLaufFilterParams(qs)
    const filterGreinId = qs.greinId && qs.greinId !== 'all' ? qs.greinId : null
    const { search, runIds, readLater, dateFrom, dateTo, sort } = filterParams

    const [greinarResult, laufarResult, runirResult, sogurResult] = await Promise.all([
      queryAll(pk, GREIN_PREFIX),
      queryAll(pk, LAUF_PREFIX),
      queryAll(pk, RUN_PREFIX),
      queryAll(pk, SOGUR_PREFIX),
    ])

    const rawGreinar = (greinarResult.Items ?? []).map((t) => ({
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

    const allLaufarByGrein = new Map<string, number>()
    for (const w of laufarResult.Items ?? []) {
      const tid = greinIdFrom(w)
      if (tid) allLaufarByGrein.set(tid, (allLaufarByGrein.get(tid) ?? 0) + 1)
    }

    let laufar = (laufarResult.Items ?? []).map((w) => ({
      id: String(w.sk).split('#').pop() as string,
      title: w.title as string,
      url: w.url as string,
      favicon: w.favicon ?? null,
      read: w.read ?? false,
      readLater: w.readLater ?? false,
      greinId: greinIdFrom(w),
      runir: embeddedRuns(w).map(toRunEntry),
      createdAt: w.createdAt as string,
    }))

    laufar = filterLaufar(laufar, filterParams)
    if (filterGreinId) {
      laufar = laufar.filter((w) => w.greinId === filterGreinId)
    }

    laufar = sortLaufar(laufar, sort)

    const filteredLaufarByGrein = new Map<string, typeof laufar>()
    for (const w of laufar) {
      const tid = w.greinId
      if (tid) {
        if (!filteredLaufarByGrein.has(tid)) filteredLaufarByGrein.set(tid, [])
        filteredLaufarByGrein.get(tid)!.push(w)
      }
    }

    const allLogs = (sogurResult.Items ?? []).map((l) => ({
      id: String(l.sk).split('#').pop() as string,
      content: l.content as string,
      greinId: greinIdFrom(l),
      laufId: readLaufId(l),
      runir: embeddedRuns(l).map(toRunEntry),
      createdAt: l.createdAt as string,
    }))

    const logCountByGrein = new Map<string, number>()
    const logsByLauf = new Map<string, typeof allLogs>()
    for (const log of allLogs) {
      if (log.greinId) {
        logCountByGrein.set(log.greinId, (logCountByGrein.get(log.greinId) ?? 0) + 1)
      }
      if (log.laufId) {
        if (!logsByLauf.has(log.laufId)) logsByLauf.set(log.laufId, [])
        logsByLauf.get(log.laufId)!.push(log)
      }
    }

    const hasLaufFilter = !!(search || runIds.length > 0 || readLater || dateFrom || dateTo)

    let activeGreinar = rawGreinar.filter((t) => {
      const hasFilteredLaufar = (filteredLaufarByGrein.get(t.id)?.length ?? 0) > 0
      const hasLogs = (logCountByGrein.get(t.id) ?? 0) > 0
      if (hasLaufFilter) return hasFilteredLaufar
      return hasFilteredLaufar || hasLogs
    })

    if (filterGreinId) {
      activeGreinar = activeGreinar.filter((t) => t.id === filterGreinId)
    }

    if (sort === 'oldest') {
      activeGreinar.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (sort === 'newest') {
      activeGreinar.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      activeGreinar.sort((a, b) => a.name.localeCompare(b.name))
    }

    const skip = (page - 1) * PAGE_SIZE
    const pageGreinar = activeGreinar.slice(skip, skip + PAGE_SIZE)
    const hasMore = skip + PAGE_SIZE < activeGreinar.length

    const filteredCountMap: Record<string, number> = {}
    const folders = pageGreinar.map((t) => {
      const greinLaufar = filteredLaufarByGrein.get(t.id) ?? []
      filteredCountMap[t.id] = greinLaufar.length

      const topLaufar = greinLaufar.slice(0, LAUFAR_PER_GREIN).map((w) => ({
        ...w,
        logs: (logsByLauf.get(w.id) ?? [])
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 1),
      }))

      return {
        id: t.id,
        name: t.name,
        laufar: topLaufar,
        _count: {
          laufar: allLaufarByGrein.get(t.id) ?? 0,
          logs: logCountByGrein.get(t.id) ?? 0,
        },
      }
    })

    const allFolders = rawGreinar.map((t) => ({ id: t.id, name: t.name }))

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
