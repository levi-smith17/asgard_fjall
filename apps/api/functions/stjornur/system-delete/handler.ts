import { DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId } from '../../shared/auth'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)

    if (!id) {
      return toApiGatewayResponse(badRequest('Missing system id'))
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk: 'SF#SYSTEM', sk: `SYSTEM#${id}` },
      }),
    )

    return toApiGatewayResponse(noContent())
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
