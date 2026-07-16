import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { sogurSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

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

    if (body.trailId) {
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

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
