import { DeleteCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { sagaSk } from '../../shared/keys'
import { detachSagaThattr, getSaga } from '../../shared/sagas'
import { toApiGatewayResponse, noContent, badRequest, notFound, serverError } from '../../shared/response'

/**
 * Deletes the Saga record only. Child Thattr are detached (sagaId removed)
 * and retain any inherited greinId — safer than cascading deletes.
 */
export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)
    if (!id) return toApiGatewayResponse(badRequest('Missing saga id'))

    const pk = getPk(event)
    const existing = await getSaga(pk, id)
    if (!existing) return toApiGatewayResponse(notFound('Saga not found'))

    const ordered = Array.isArray(existing.orderedThattrIds) ? existing.orderedThattrIds : []
    await detachSagaThattr(pk, ordered)

    await dynamo.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: sagaSk(id) },
      }),
    )

    return toApiGatewayResponse(noContent())
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
