import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { sendibodSk } from '../../shared/keys'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const token = event.pathParameters?.token
    if (!token) return toApiGatewayResponse(badRequest('Missing token'))

    const tokenItem = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'TOKEN', sk: token },
      }),
    )

    if (!tokenItem.Item) return toApiGatewayResponse(notFound('Thread not found'))

    const { userPk, signalId, tokenExpiresAt } = tokenItem.Item

    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': userPk,
          ':prefix': sendibodSk(signalId),
        },
      }),
    )

    const items = result.Items ?? []
    const signal = items.find((i) => i.sk === sendibodSk(signalId))
    if (!signal) return toApiGatewayResponse(notFound('Signal not found'))

    const replies = items
      .filter((i) => String(i.sk).includes('#REPLY#'))
      .map((r) => ({
        id: String(r.sk).split('#REPLY#')[1],
        body: r.body,
        direction: r.direction,
        senderName: r.senderName ?? null,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime())

    const profileResult = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk: userPk, sk: 'PROFILE' },
      }),
    )

    const profile = profileResult.Item

    return toApiGatewayResponse(
      ok({
        id: signalId,
        senderName: signal.senderName,
        body: signal.body,
        createdAt: signal.createdAt,
        tokenExpiresAt,
        wayfarer: {
          username: profile?.username ?? null,
          name: profile?.name ?? profile?.username ?? null,
          image: profile?.image ?? null,
        },
        replies,
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
