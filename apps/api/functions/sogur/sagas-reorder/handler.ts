import { BatchGetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { idFromSk, SOGUR_PREFIX, sagaSk, sogurSk } from '../../shared/keys'
import { getSaga } from '../../shared/sagas'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)
    if (!id) return toApiGatewayResponse(badRequest('Missing saga id'))

    const body = JSON.parse(event.body ?? '{}')
    const orderedThattrIds: unknown =
      body.orderedThattrIds ?? body.orderedIds ?? null

    if (!Array.isArray(orderedThattrIds)) {
      return toApiGatewayResponse(badRequest('orderedThattrIds is required'))
    }

    const nextIds = orderedThattrIds.filter((v): v is string => typeof v === 'string' && v.length > 0)
    if (new Set(nextIds).size !== nextIds.length) {
      return toApiGatewayResponse(badRequest('orderedThattrIds must be unique'))
    }

    const pk = getPk(event)
    const saga = await getSaga(pk, id)
    if (!saga) return toApiGatewayResponse(notFound('Saga not found'))

    if (nextIds.length > 0) {
      const batch = await dynamo.send(
        new BatchGetCommand({
          RequestItems: {
            [TABLE_NAME]: {
              Keys: nextIds.map((thattrId) => ({ pk, sk: sogurSk(thattrId) })),
            },
          },
        }),
      )
      const items = batch.Responses?.[TABLE_NAME] ?? []
      if (items.length !== nextIds.length) {
        return toApiGatewayResponse(badRequest('One or more Thattr ids were not found'))
      }
      for (const item of items) {
        const thattrId = idFromSk(String(item.sk), SOGUR_PREFIX)
        if (item.sagaId !== id) {
          return toApiGatewayResponse(
            badRequest(`Thattr ${thattrId} does not belong to this saga`),
          )
        }
      }
    }

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: sagaSk(id) },
        UpdateExpression: 'SET orderedThattrIds = :ordered, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':ordered': nextIds,
          ':updatedAt': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      }),
    )

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
