import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { SAGA_PREFIX } from '../../shared/keys'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

/**
 * List first-class Saga records only (SAGA#*).
 * Legacy greinId-grouped SOGUR# Thattr are not synthesized here —
 * clients may backfill/group those until migrated onto Saga records.
 */
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
          ':prefix': SAGA_PREFIX,
        },
      }),
    )

    return toApiGatewayResponse(ok(result.Items ?? []))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
