import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { sendibodReplySk } from '../../shared/keys'
import { toApiGatewayResponse, created, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const token = event.pathParameters?.token
    if (!token) return toApiGatewayResponse(badRequest('Missing token'))

    const body = JSON.parse(event.body ?? '{}')
    if (!body.body) return toApiGatewayResponse(badRequest('body is required'))

    const tokenItem = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'TOKEN', sk: token },
      }),
    )

    if (!tokenItem.Item) return toApiGatewayResponse(notFound('Thread not found'))

    const { userPk, signalId, tokenExpiresAt } = tokenItem.Item

    if (new Date(tokenExpiresAt as string) < new Date()) {
      return toApiGatewayResponse(badRequest('Reply link has expired'))
    }

    const replyId = randomUUID()
    const sk = sendibodReplySk(signalId, replyId)
    const reply = {
      pk: userPk,
      sk,
      body: body.body,
      direction: 'INBOUND',
      createdAt: new Date().toISOString(),
    }

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: reply,
      }),
    )

    return toApiGatewayResponse(
      created({
        id: replyId,
        body: reply.body,
        direction: reply.direction,
        createdAt: reply.createdAt,
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
