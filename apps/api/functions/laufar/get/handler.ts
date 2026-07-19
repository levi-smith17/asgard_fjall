import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { LAUF_PREFIX } from '../../shared/keys'
import { withCanonicalDomainAttrs } from '../../shared/legacy-attrs'
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
        ExpressionAttributeValues: {
          ':pk': pk,
          ':prefix': LAUF_PREFIX,
        },
      }),
    )
    const items = (result.Items ?? []).map((item) => withCanonicalDomainAttrs(item))
    return toApiGatewayResponse(ok(items))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
