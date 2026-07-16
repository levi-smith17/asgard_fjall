import { BatchGetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { GREIN_PREFIX, laufSk, runSk } from '../../shared/keys'
import { badRequest, ok, serverError, toApiGatewayResponse } from '../../shared/response'

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
    const id = getPathId(event)
    if (!id) return toApiGatewayResponse(badRequest('Missing lauf id'))

    const body = JSON.parse(event.body ?? '{}')
    const hasContentUpdate = 'title' in body || 'url' in body
    const hasReadUpdate = 'read' in body || 'readLater' in body

    if (hasContentUpdate && (!body.title || !body.url)) {
      return toApiGatewayResponse(badRequest('title and url are required'))
    }
    if (!hasContentUpdate && !hasReadUpdate) {
      return toApiGatewayResponse(badRequest('No valid fields to update'))
    }

    const pk = getPk(event)
    const sk = laufSk(id)
    const setExprs: string[] = []
    const removeExprs: string[] = []
    const exprNames: Record<string, string> = {}
    const exprValues: Record<string, unknown> = {}

    if ('read' in body) {
      setExprs.push('#read = :read')
      exprNames['#read'] = 'read'
      exprValues[':read'] = body.read
    }
    if ('readLater' in body) {
      setExprs.push('readLater = :readLater')
      exprValues[':readLater'] = body.readLater
    }

    if (hasContentUpdate) {
      const runir = await resolveRunir(pk, Array.isArray(body.runirIds) ? body.runirIds : [])
      setExprs.push('#title = :title', '#url = :url', 'runir = :runir')
      exprNames['#title'] = 'title'
      exprNames['#url'] = 'url'
      exprValues[':title'] = body.title
      exprValues[':url'] = body.url
      exprValues[':runir'] = runir

      if (body.description) {
        setExprs.push('description = :description')
        exprValues[':description'] = body.description
      } else {
        removeExprs.push('description')
      }
      if (body.notes) {
        setExprs.push('notes = :notes')
        exprValues[':notes'] = body.notes
      } else {
        removeExprs.push('notes')
      }
      if (body.favicon) {
        setExprs.push('favicon = :favicon')
        exprValues[':favicon'] = body.favicon
      } else {
        removeExprs.push('favicon')
      }
      if (body.greinId) {
        setExprs.push('greinId = :greinId', 'gsi1pk = :gsi1pk', 'gsi1sk = :gsi1sk')
        exprValues[':greinId'] = body.greinId
        exprValues[':gsi1pk'] = `${GREIN_PREFIX}${body.greinId}`
        exprValues[':gsi1sk'] = sk
      } else {
        removeExprs.push('greinId', 'gsi1pk', 'gsi1sk')
      }
    }

    const parts: string[] = []
    if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
    if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk },
        UpdateExpression: parts.join(' '),
        ...(Object.keys(exprNames).length > 0 ? { ExpressionAttributeNames: exprNames } : {}),
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW',
      }),
    )

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
