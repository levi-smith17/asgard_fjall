import { QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { IDUNN_PREFIX, SENDIBOD_PREFIX, SKATT_PREFIX, SURTR_PREFIX } from '../../shared/keys'
import { resolveOwnerAccountEmail } from '../../shared/owner-email'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

function queryAll(pk: string, prefix: string) {
  return dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': pk, ':prefix': prefix },
    }),
  )
}

function normalizeToMonthly(amount: number, billingCycle: string): number {
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
    default:
      return amount
  }
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)

    const [
      profileResult,
      expeditionsResult,
      trainingResult,
      gearResult,
      landmarksResult,
      summitsResult,
      pathfindingResult,
      companionsResult,
      idunnResult,
      surtrResult,
      skattResult,
      sendibodResult,
      stopsResult,
    ] = await Promise.all([
      dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
      queryAll(pk, 'EXPEDITION#'),
      queryAll(pk, 'TRAINING#'),
      queryAll(pk, 'GEAR#'),
      queryAll(pk, 'LANDMARK#'),
      queryAll(pk, 'SUMMIT#'),
      queryAll(pk, 'PATHFINDING#'),
      queryAll(pk, 'COMPANION#'),
      queryAll(pk, IDUNN_PREFIX),
      queryAll(pk, SURTR_PREFIX),
      queryAll(pk, SKATT_PREFIX),
      queryAll(pk, SENDIBOD_PREFIX),
      queryAll(pk, 'STOP#'),
    ])

    const profile = profileResult.Item ?? {}
    const expeditions = expeditionsResult.Items ?? []
    const training = trainingResult.Items ?? []
    const gear = gearResult.Items ?? []
    const landmarks = landmarksResult.Items ?? []
    const summits = summitsResult.Items ?? []
    const pathfinding = pathfindingResult.Items ?? []
    const companions = companionsResult.Items ?? []
    const supplylines = idunnResult.Items ?? []
    const burns = surtrResult.Items ?? []
    const caches = skattResult.Items ?? []
    const signals = (sendibodResult.Items ?? []).filter((s) => !String(s.sk).includes('#REPLY#'))
    const stops = stopsResult.Items ?? []

    const sortedExpeditions = [...expeditions].sort(
      (a, b) => new Date(String(b.startDate)).getTime() - new Date(String(a.startDate)).getTime(),
    )
    const mostRecentExpedition = sortedExpeditions[0]
      ? { title: sortedExpeditions[0].title, company: sortedExpeditions[0].company }
      : null

    const sortedTraining = [...training].sort(
      (a, b) => new Date(String(b.startDate)).getTime() - new Date(String(a.startDate)).getTime(),
    )
    const mostRecentTraining = sortedTraining[0]
      ? { institution: sortedTraining[0].institution, degree: sortedTraining[0].degree ?? null }
      : null

    let totalYearsExperience = 0
    for (const exp of expeditions) {
      const start = new Date(String(exp.startDate))
      const end = exp.endDate ? new Date(String(exp.endDate)) : new Date()
      totalYearsExperience += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    }

    const topGear = gear.slice(0, 5).map((g) => ({ name: g.name }))

    const mostRecentLandmark = landmarks[0]
      ? { name: (landmarks[0] as { name?: string }).name ?? 'Landmark' }
      : null
    const mostRecentSummit = summits[0]
      ? { name: (summits[0] as { title?: string }).title ?? 'Summit' }
      : null
    const mostRecentPathfinding = pathfinding[0]
      ? {
          organization: (pathfinding[0] as { organization?: string }).organization ?? null,
          role: (pathfinding[0] as { role?: string }).role ?? null,
        }
      : null
    const mostRecentCompanion = companions[0]
      ? { name: (companions[0] as { name?: string }).name ?? 'Companion' }
      : null

    const activeSupplylines = supplylines.filter((s) => s.active)
    const monthlyTotal = activeSupplylines.reduce(
      (sum, s) => sum + normalizeToMonthly(Number(s.amount), String(s.billingCycle)),
      0,
    )
    const now = new Date()
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthBurns = burns.filter((b) => String(b.date).startsWith(monthPrefix))
    const monthlyBurn = monthBurns.reduce((sum, b) => sum + Number(b.amount), 0)

    const monthCaches = caches.filter((c) => {
      const parts = String(c.sk).split('#')
      return parts[2] === String(now.getMonth() + 1) && parts[3] === String(now.getFullYear())
    })
    const cacheTotalLimit = monthCaches.reduce((sum, c) => sum + Number(c.limit ?? 0), 0)
    const cacheTotalSpent = monthCaches.reduce((sum, c) => {
      const runId = String(c.sk).split('#')[1]
      return (
        sum +
        monthBurns
          .filter((b) =>
            ((b.runir ?? []) as { id: string }[]).some((m) => m.id === runId),
          )
          .reduce((s, b) => s + Number(b.amount), 0)
      )
    }, 0)

    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingRenewals = activeSupplylines.filter((s) => {
      const renewal = new Date(String(s.nextRenewal))
      return renewal >= now && renewal <= sevenDaysOut
    }).length

    const unreadCount = signals.filter((s) => !s.read).length
    const latestMessages = [...signals]
      .sort(
        (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime(),
      )
      .slice(0, 3)
      .map((s) => ({
        id: String(s.sk).split('#')[1],
        senderName: s.senderName,
        body: s.body,
        createdAt: s.createdAt,
        read: s.read ?? false,
      }))

    const fourDaysOut = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)
    const upcomingStops = stops
      .filter((s) => {
        const start = new Date(String(s.startDate))
        return start >= now && start <= fourDaysOut
      })
      .sort(
        (a, b) => new Date(String(a.startDate)).getTime() - new Date(String(b.startDate)).getTime(),
      )
      .map((s) => ({
        id: String(s.sk).split('#')[1],
        title: s.title,
        startDate: s.startDate,
        endDate: s.endDate ?? null,
        allDay: s.allDay ?? false,
        color:
          ((s.runir ?? []) as { color?: string }[])[0]?.color ?? '#007AFF',
      }))

    return toApiGatewayResponse(
      ok({
        wayfarer: {
          name: profile.name ?? null,
          email: resolveOwnerAccountEmail(
            typeof profile.email === 'string' ? profile.email : null,
          ),
          image: profile.image ?? null,
          username: profile.username ?? null,
          origins: {
            headline: profile.headline ?? null,
            location: profile.location ?? null,
            website: profile.website ?? null,
            linkedin: profile.linkedin ?? null,
            github: profile.github ?? null,
          },
        },
        manifestCounts: {
          expeditions: expeditions.length,
          training: training.length,
          gear: gear.length,
          landmarks: landmarks.length,
          summits: summits.length,
          pathfinding: pathfinding.length,
          companions: companions.length,
        },
        manifestHighlights: {
          totalYearsExperience: Math.round(totalYearsExperience),
          mostRecentExpedition,
          mostRecentTraining,
          topGear,
          mostRecentLandmark,
          mostRecentSummit,
          mostRecentPathfinding,
          mostRecentCompanion,
        },
        provisionsSummary: {
          monthlyTotal,
          monthlyBurn,
          cacheTotalLimit,
          cacheTotalSpent,
          activeCount: activeSupplylines.length,
          upcomingRenewals,
        },
        signalsSummary: {
          unreadCount,
          latestMessages,
          emailAccounts: [],
        },
        dagatalSummary: {
          stops: upcomingStops,
        },
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
