import { DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { sogurSk } from '../../shared/keys'
import { removeThattrFromSagaOrder } from '../../shared/sagas'
import { toApiGatewayResponse, noContent, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)

    if (!id) {
      return toApiGatewayResponse(badRequest('Missing log id'))
    }

    const pk = getPk(event)
    const sk = sogurSk(id)

    const existing = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk },
      }),
    )

    const sagaId =
      typeof existing.Item?.sagaId === 'string' && existing.Item.sagaId.length > 0
        ? existing.Item.sagaId
        : null

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk },
      }),
    )

    if (sagaId) {
      await removeThattrFromSagaOrder(pk, sagaId, id)
    }

    return toApiGatewayResponse(noContent())
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
