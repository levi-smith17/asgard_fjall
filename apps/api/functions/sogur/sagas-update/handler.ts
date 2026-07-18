import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { sagaSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import {
  getSaga,
  propagateSagaTrailId,
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

    const markerMap = await resolveRunirById(pk, Array.isArray(body.markerIds) ? body.markerIds : [])
    const markers = [...markerMap.values()]

    const nextTrailId =
      typeof body.trailId === 'string' && body.trailId.length > 0 ? body.trailId : null
    const prevTrailId =
      typeof existing.trailId === 'string' && existing.trailId.length > 0 ? existing.trailId : null

    const setExprs = ['#name = :name', 'markers = :markers', 'updatedAt = :updatedAt']
    const removeExprs: string[] = []
    const exprNames: Record<string, string> = { '#name': 'name' }
    const exprValues: Record<string, unknown> = {
      ':name': body.name.trim(),
      ':markers': markers,
      ':updatedAt': new Date().toISOString(),
    }

    if (nextTrailId) {
      setExprs.push('trailId = :trailId')
      exprValues[':trailId'] = nextTrailId
    } else {
      removeExprs.push('trailId')
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

    if (nextTrailId !== prevTrailId) {
      const ordered = Array.isArray(existing.orderedThattrIds) ? existing.orderedThattrIds : []
      await propagateSagaTrailId(pk, ordered, nextTrailId)
    }

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
