import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { ok, serverError, toApiGatewayResponse } from '../../shared/response'

const DEFAULT_SETTINGS = {
  appearance: {
    sidebarDefault: 'EXPANDED',
    defaultLandingPage: '/laufar',
    dateFormat: 'MDY',
    publicDefaultTheme: 'SYSTEM',
    publicDefaultPalette: 'fjall',
  },
  privacy: {
    manifestVisibility: 'PRIVATE',
    contactFormEnabled: false,
  },
  dagatal: {
    defaultView: 'MONTH',
    firstDayOfWeek: 'SUNDAY',
    defaultEventDuration: 60,
    showWeekNumbers: false,
  },
  laufar: {
    defaultSort: 'NEWEST',
    openInNewTab: true,
    laufarPerPage: 25,
  },
  sogur: {
    sogurPerPage: 25,
    defaultSort: 'NEWEST',
  },
  sendibod: {
    messagesPerPage: 25,
    autoMarkRead: true,
    autoRefreshInterval: 15,
    compactView: false,
    showSnippets: true,
    browserNotifications: false,
    notificationSound: true,
  },
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)

    const [profileResult, settingsResult, calendarsResult, subscriptionsResult] = await Promise.all([
      dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'PROFILE' } })),
      dynamo.send(new GetCommand({ TableName: TABLE_NAME, Key: { pk, sk: 'SETTINGS' } })),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ITINERARY#' },
        }),
      ),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': 'ITINERARY_SUB#' },
        }),
      ),
    ])

    const profile = profileResult.Item ?? {}
    const settings = settingsResult.Item ?? {}

    const sendibod = {
      ...DEFAULT_SETTINGS.sendibod,
      ...(settings.sendibod ?? settings.signals ?? {}),
      browserNotifications:
        settings.sendibod?.browserNotifications ??
        settings.signals?.browserNotifications ??
        settings.notifications?.browserNotifications ??
        DEFAULT_SETTINGS.sendibod.browserNotifications,
      notificationSound:
        settings.sendibod?.notificationSound ??
        settings.signals?.notificationSound ??
        settings.notifications?.notificationSound ??
        DEFAULT_SETTINGS.sendibod.notificationSound,
    }

    const calendars = (calendarsResult.Items ?? []).map(({ ssmPasswordPath: _omit, ...rest }) => ({
      ...rest,
      id: String(rest.sk).replace('ITINERARY#', ''),
    }))

    const calendarSubscriptions = (subscriptionsResult.Items ?? []).map((item) => ({
      ...item,
      id: String(item.sk).replace('ITINERARY_SUB#', ''),
    }))

    const laufarStored = settings.laufar ?? settings.waypoints ?? {}
    const sogurStored = settings.sogur ?? settings.logs ?? {}
    const dagatalStored = settings.dagatal ?? settings.itinerary ?? {}

    return toApiGatewayResponse(
      ok({
        account: {
          name: profile.name ?? null,
          image: profile.image ?? null,
          username: profile.username ?? null,
          timeFormat: profile.timeFormat ?? 'TWELVE',
          listed: profile.listed ?? false,
          defaultTerminology: profile.defaultTerminology ?? 'STANDARD',
          defaultTheme: profile.defaultTheme ?? 'SYSTEM',
          headline: profile.headline ?? null,
          summary: profile.summary ?? null,
          location: profile.location ?? null,
          linkedin: profile.linkedin ?? null,
          github: profile.github ?? null,
          customDomain: profile.customDomain ?? null,
        },
        appearance: { ...DEFAULT_SETTINGS.appearance, ...(settings.appearance ?? {}) },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...(settings.privacy ?? {}) },
        dagatal: { ...DEFAULT_SETTINGS.dagatal, ...dagatalStored },
        laufar: {
          ...DEFAULT_SETTINGS.laufar,
          ...laufarStored,
          laufarPerPage:
            laufarStored.laufarPerPage ?? laufarStored.waypointsPerPage ?? DEFAULT_SETTINGS.laufar.laufarPerPage,
        },
        sogur: {
          ...DEFAULT_SETTINGS.sogur,
          ...sogurStored,
          sogurPerPage: sogurStored.sogurPerPage ?? sogurStored.logsPerPage ?? DEFAULT_SETTINGS.sogur.sogurPerPage,
        },
        sendibod,
        calendars,
        calendarSubscriptions,
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
