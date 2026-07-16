import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { GREIN_PREFIX } from '../../shared/keys'
import { ok, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)
    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': pk, ':prefix': GREIN_PREFIX },
      }),
    )
    return toApiGatewayResponse(ok(result.Items ?? []))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
