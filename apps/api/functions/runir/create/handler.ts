import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { runSk } from '../../shared/keys'
import { badRequest, created, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')
    if (!body.name || !body.color) {
      return toApiGatewayResponse(badRequest('name and color are required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = runSk(id)
    const run = {
      pk,
      sk,
      gsi1pk: pk,
      gsi1sk: sk,
      name: body.name,
      color: body.color,
      icon: body.icon ?? undefined,
      createdAt: new Date().toISOString(),
    }

    await dynamo.send(new PutCommand({ TableName: TABLE_NAME, Item: run }))
    return toApiGatewayResponse(created(run))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
