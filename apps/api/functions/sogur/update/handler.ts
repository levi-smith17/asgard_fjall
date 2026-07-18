import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { sogurSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import {
  appendThattrToSagaOrder,
  getSaga,
  removeThattrFromSagaOrder,
} from '../../shared/sagas'
import { toApiGatewayResponse, ok, badRequest, notFound, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)

    if (!id) {
      return toApiGatewayResponse(badRequest('Missing log id'))
    }

    const body = JSON.parse(event.body ?? '{}')

    if (!body.content) {
      return toApiGatewayResponse(badRequest('content is required'))
    }

    const pk = getPk(event)
    const sk = sogurSk(id)

    const existingResult = await dynamo.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk },
      }),
    )
    if (!existingResult.Item) {
      return toApiGatewayResponse(notFound('Thattr not found'))
    }
    const existing = existingResult.Item
    const prevSagaId =
      typeof existing.sagaId === 'string' && existing.sagaId.length > 0 ? existing.sagaId : null

    const markerMap = await resolveRunirById(pk, Array.isArray(body.markerIds) ? body.markerIds : [])
    const markers = [...markerMap.values()]

    const setExprs: string[] = ['#content = :content', 'markers = :markers', 'updatedAt = :updatedAt']
    const removeExprs: string[] = []
    const exprNames: Record<string, string> = { '#content': 'content' }
    const exprValues: Record<string, unknown> = {
      ':content': body.content,
      ':markers': markers,
      ':updatedAt': new Date().toISOString(),
    }

    if (body.title) {
      setExprs.push('#title = :title')
      exprNames['#title'] = 'title'
      exprValues[':title'] = body.title
    } else {
      removeExprs.push('title')
    }

    let nextSagaId = prevSagaId
    let inheritedTrailId: string | null | undefined

    if ('sagaId' in body) {
      nextSagaId =
        typeof body.sagaId === 'string' && body.sagaId.length > 0 ? body.sagaId : null

      if (nextSagaId) {
        const saga = await getSaga(pk, nextSagaId)
        if (!saga) return toApiGatewayResponse(notFound('Saga not found'))
        inheritedTrailId =
          typeof saga.trailId === 'string' && saga.trailId.length > 0 ? saga.trailId : null
        setExprs.push('sagaId = :sagaId')
        exprValues[':sagaId'] = nextSagaId
      } else {
        removeExprs.push('sagaId')
      }
    }

    // When attaching/changing sagaId, inherit saga.trailId. Otherwise honor body.trailId.
    if (inheritedTrailId !== undefined) {
      if (inheritedTrailId) {
        setExprs.push('trailId = :trailId')
        exprValues[':trailId'] = inheritedTrailId
      } else {
        removeExprs.push('trailId')
      }
    } else if (body.trailId) {
      setExprs.push('trailId = :trailId')
      exprValues[':trailId'] = body.trailId
    } else {
      removeExprs.push('trailId')
    }

    if (body.waypointId) {
      setExprs.push('waypointId = :waypointId')
      exprValues[':waypointId'] = body.waypointId
    } else {
      removeExprs.push('waypointId')
    }

    let UpdateExpression = `SET ${setExprs.join(', ')}`
    if (removeExprs.length > 0) UpdateExpression += ` REMOVE ${removeExprs.join(', ')}`

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk },
        UpdateExpression,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW',
      }),
    )

    if (prevSagaId !== nextSagaId) {
      if (prevSagaId) await removeThattrFromSagaOrder(pk, prevSagaId, id)
      if (nextSagaId) await appendThattrToSagaOrder(pk, nextSagaId, id)
    }

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
