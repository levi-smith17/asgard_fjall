import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { SKATT_PREFIX } from '../../shared/keys'
import { findSkattById } from '../../shared/skatt'
import { toApiGatewayResponse, noContent, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)

    if (!id) {
      return toApiGatewayResponse(badRequest('Missing cache id'))
    }

    const pk = getPk(event)

    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':prefix': SKATT_PREFIX,
        },
      }),
    )

    const skatt = findSkattById(
      (result.Items ?? []) as { sk: string; id?: string }[],
      id,
    )

    if (!skatt) {
      return toApiGatewayResponse(notFound('Cache not found'))
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: skatt.sk },
      }),
    )

    return toApiGatewayResponse(noContent())
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
