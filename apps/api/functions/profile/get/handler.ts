import { GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { SENDIBOD_PREFIX } from '../../shared/keys'
import {
  OWNER_ACCOUNT_EMAIL,
  resolveOwnerAccountEmail,
} from '../../shared/owner-email'
import { notFound, ok, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)

    const [profileResult, sendibodResult] = await Promise.all([
      dynamo.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { pk, sk: 'PROFILE' },
        }),
      ),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: {
            ':pk': pk,
            ':prefix': SENDIBOD_PREFIX,
          },
        }),
      ),
    ])

    if (!profileResult.Item) return toApiGatewayResponse(notFound('Profile not found'))

    const profile = profileResult.Item
    const email = resolveOwnerAccountEmail(
      typeof profile.email === 'string' ? profile.email : null,
    )
    if (email === OWNER_ACCOUNT_EMAIL && profile.email !== OWNER_ACCOUNT_EMAIL) {
      void dynamo
        .send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: 'PROFILE' },
            UpdateExpression: 'SET email = :email',
            ExpressionAttributeValues: { ':email': OWNER_ACCOUNT_EMAIL },
          }),
        )
        .catch((err) => console.error('Failed to migrate profile email', err))
    }

    const sendibod = (sendibodResult.Items ?? []).filter(
      (s) => !String(s.sk ?? '').includes('#REPLY#'),
    )
    const unreadSendibod = sendibod.filter((s) => !s.read).length

    return toApiGatewayResponse(
      ok({
        username: profile.username ?? null,
        name: profile.name ?? null,
        email,
        image: profile.image ?? null,
        isAdmin: profile.isAdmin ?? false,
        // Wire field kept as `signals` for existing clients; counts SENDIBOD# threads.
        signals: unreadSendibod,
        dagatal: 0,
      }),
    )
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
