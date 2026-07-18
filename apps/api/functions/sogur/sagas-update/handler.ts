import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { sagaSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import {
  getSaga,
  propagateSagaGreinId,
  sagaGreinId,
} from '../../shared/sagas'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)
    if (!id) return toApiGatewayResponse(badRequest('Missing saga id'))

    const body = JSON.parse(event.body ?? '{}')
    if (!body.name || typeof body.name !== 'string') {
      return toApiGatewayResponse(badRequest('name is required'))
    }

    const pk = getPk(event)
    const existing = await getSaga(pk, id)
    if (!existing) return toApiGatewayResponse(notFound('Saga not found'))

    const runMap = await resolveRunirById(pk, Array.isArray(body.runIds) ? body.runIds : [])
    const runir = [...runMap.values()]

    const nextGreinId =
      typeof body.greinId === 'string' && body.greinId.length > 0 ? body.greinId : null
    const prevGreinId = sagaGreinId(existing)

    const setExprs = ['#name = :name', 'runir = :runir', 'updatedAt = :updatedAt']
    const removeExprs: string[] = []
    const exprNames: Record<string, string> = { '#name': 'name' }
    const exprValues: Record<string, unknown> = {
      ':name': body.name.trim(),
      ':runir': runir,
      ':updatedAt': new Date().toISOString(),
    }

    if (nextGreinId) {
      setExprs.push('greinId = :greinId')
      exprValues[':greinId'] = nextGreinId
    } else {
      removeExprs.push('greinId')
    }

    let UpdateExpression = `SET ${setExprs.join(', ')}`
    if (removeExprs.length > 0) UpdateExpression += ` REMOVE ${removeExprs.join(', ')}`

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: sagaSk(id) },
        UpdateExpression,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW',
      }),
    )

    if (nextGreinId !== prevGreinId) {
      const ordered = Array.isArray(existing.orderedThattrIds) ? existing.orderedThattrIds : []
      await propagateSagaGreinId(pk, ordered, nextGreinId)
    }

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
