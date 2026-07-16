import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { SENDIBOD_PREFIX } from '../../shared/keys'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)

    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':prefix': SENDIBOD_PREFIX,
        },
      }),
    )

    const items = result.Items ?? []
    const signalItems = items.filter((item) => !String(item.sk).includes('#REPLY#'))
    const replyItems = items.filter((item) => String(item.sk).includes('#REPLY#'))

    const signals = signalItems
      .map((signal) => {
        const signalId = String(signal.sk).split('#')[1]
        const replies = replyItems
          .filter((r) => String(r.sk).startsWith(`${SENDIBOD_PREFIX}${signalId}#REPLY#`))
          .map((r) => ({
            id: String(r.sk).split('#REPLY#')[1],
            body: r.body,
            direction: r.direction,
            senderName: r.senderName ?? null,
            senderEmail: r.senderEmail ?? null,
            createdAt: r.createdAt,
          }))
          .sort((a, b) => new Date(String(a.createdAt)).getTime() - new Date(String(b.createdAt)).getTime())

        return {
          id: signalId,
          senderName: signal.senderName,
          senderEmail: signal.senderEmail,
          body: signal.body,
          read: signal.read,
          createdAt: signal.createdAt,
          replies,
        }
      })
      .sort((a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime())

    return toApiGatewayResponse(ok(signals))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
