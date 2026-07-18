import { BatchGetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { GREIN_PREFIX, laufSk, runSk } from '../../shared/keys'
import { badRequest, created, serverError, toApiGatewayResponse } from '../../shared/response'

type EmbeddedRun = {
  id: string
  name: string
  color: string
  icon?: string
}

async function resolveRunir(pk: string, runirIds: string[]): Promise<EmbeddedRun[]> {
  if (!runirIds.length) return []
  const result = await dynamo.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: runirIds.map((id) => ({ pk, sk: runSk(id) })),
        },
      },
    }),
  )
  return (result.Responses?.[TABLE_NAME] ?? []).map((m) => ({
    id: String(m.sk).split('#').pop() as string,
    name: m.name as string,
    color: m.color as string,
    ...(m.icon ? { icon: m.icon as string } : {}),
  }))
}

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')
    if (!body.url || !body.title) {
      return toApiGatewayResponse(badRequest('url and title are required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = laufSk(id)
    const runir = await resolveRunir(pk, Array.isArray(body.runIds) ? body.runIds : Array.isArray(body.runirIds) ? body.runirIds : Array.isArray(body.markerIds) ? body.markerIds : [])

    const lauf = {
      pk,
      sk,
      url: body.url,
      title: body.title,
      ...(body.description ? { description: body.description } : {}),
      ...(body.favicon ? { favicon: body.favicon } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
      read: false,
      readLater: false,
      ...((body.greinId ?? body.trailId) ? { greinId: body.greinId ?? body.trailId } : {}),
      runir,
      createdAt: new Date().toISOString(),
    }

    const item: Record<string, unknown> = { ...lauf }
    if (body.greinId ?? body.trailId) {
      item.gsi1pk = `${GREIN_PREFIX}${body.greinId ?? body.trailId}`
      item.gsi1sk = sk
    }

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
    return toApiGatewayResponse(created(lauf))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
