import { DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { GREIN_PREFIX, LAUF_PREFIX, greinSk } from '../../shared/keys'
import { badRequest, noContent, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)
    if (!id) return toApiGatewayResponse(badRequest('Missing grein id'))

    const pk = getPk(event)
    const laufarResult = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'gsi1',
        KeyConditionExpression: 'gsi1pk = :gsi1pk AND begins_with(gsi1sk, :prefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': `${GREIN_PREFIX}${id}`,
          ':prefix': LAUF_PREFIX,
        },
      }),
    )

    await Promise.all([
      dynamo.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: { pk, sk: greinSk(id) },
        }),
      ),
      ...(laufarResult.Items ?? []).map((item) =>
        dynamo.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: item.sk as string },
            UpdateExpression: 'REMOVE greinId, gsi1pk, gsi1sk',
          }),
        ),
      ),
    ])

    return toApiGatewayResponse(noContent())
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
