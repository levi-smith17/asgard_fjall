import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { sagaSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')

    if (!body.name || typeof body.name !== 'string') {
      return toApiGatewayResponse(badRequest('name is required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = sagaSk(id)
    const now = new Date().toISOString()

    const runMap = await resolveRunirById(pk, Array.isArray(body.runIds) ? body.runIds : [])
    const runir = [...runMap.values()]

    const greinId =
      typeof body.greinId === 'string' && body.greinId.length > 0 ? body.greinId : null

    const saga = {
      pk,
      sk,
      name: body.name.trim(),
      greinId,
      runir,
      orderedThattrIds: Array.isArray(body.orderedThattrIds)
        ? body.orderedThattrIds.filter((id: unknown) => typeof id === 'string')
        : [],
      createdAt: now,
      updatedAt: now,
    }

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: saga,
      }),
    )

    return toApiGatewayResponse(created(saga))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
