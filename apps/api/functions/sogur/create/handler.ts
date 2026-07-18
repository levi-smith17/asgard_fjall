import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { sogurSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { appendThattrToSagaOrder, getSaga } from '../../shared/sagas'
import { toApiGatewayResponse, created, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')

    if (!body.content) {
      return toApiGatewayResponse(badRequest('content is required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = sogurSk(id)
    const now = new Date().toISOString()

    const sagaId =
      typeof body.sagaId === 'string' && body.sagaId.length > 0 ? body.sagaId : null

    let trailId =
      typeof body.trailId === 'string' && body.trailId.length > 0 ? body.trailId : null

    if (sagaId) {
      const saga = await getSaga(pk, sagaId)
      if (!saga) return toApiGatewayResponse(notFound('Saga not found'))
      trailId =
        typeof saga.trailId === 'string' && saga.trailId.length > 0 ? saga.trailId : null
    }

    const markerMap = await resolveRunirById(pk, Array.isArray(body.markerIds) ? body.markerIds : [])
    const markers = [...markerMap.values()]

    const sogur = {
      pk,
      sk,
      ...(body.title ? { title: body.title } : {}),
      content: body.content,
      ...(typeof body.position === 'number' ? { position: body.position } : {}),
      ...(sagaId ? { sagaId } : {}),
      ...(trailId ? { trailId } : {}),
      ...(body.waypointId ? { waypointId: body.waypointId } : {}),
      markers,
      mediaKeys: [],
      createdAt: now,
      updatedAt: now,
    }

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: sogur,
      }),
    )

    if (sagaId) {
      await appendThattrToSagaOrder(pk, sagaId, id)
    }

    return toApiGatewayResponse(created(sogur))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
