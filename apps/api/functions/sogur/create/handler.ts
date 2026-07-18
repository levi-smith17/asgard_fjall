import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { sogurSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { appendThattrToSagaOrder, getSaga, sagaGreinId } from '../../shared/sagas'
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

    let greinId =
      typeof body.greinId === 'string' && body.greinId.length > 0 ? body.greinId : null

    if (sagaId) {
      const saga = await getSaga(pk, sagaId)
      if (!saga) return toApiGatewayResponse(notFound('Saga not found'))
      greinId = sagaGreinId(saga)
    }

    const runMap = await resolveRunirById(pk, Array.isArray(body.runIds) ? body.runIds : [])
    const runir = [...runMap.values()]

    const sogur = {
      pk,
      sk,
      ...(body.title ? { title: body.title } : {}),
      content: body.content,
      ...(typeof body.position === 'number' ? { position: body.position } : {}),
      ...(sagaId ? { sagaId } : {}),
      ...(greinId ? { greinId } : {}),
      ...(body.laufId ? { laufId: body.laufId } : {}),
      runir,
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
