import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { greinSk } from '../../shared/keys'
import { sanitizeHiddenPages } from '../../shared/grein-pages'
import { badRequest, ok, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)
    if (!id) return toApiGatewayResponse(badRequest('Missing grein id'))

    const body = JSON.parse(event.body ?? '{}')
    if (!body.name) return toApiGatewayResponse(badRequest('name is required'))

    const hiddenPages = sanitizeHiddenPages(body.hiddenPages)

    const setExprs = ['#name = :name']
    const names: Record<string, string> = { '#name': 'name' }
    const values: Record<string, unknown> = { ':name': body.name }

    if (hiddenPages !== undefined) {
      setExprs.push('hiddenPages = :hiddenPages')
      values[':hiddenPages'] = hiddenPages
    }

    const pk = getPk(event)
    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk: greinSk(id) },
        UpdateExpression: `SET ${setExprs.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
        ReturnValues: 'ALL_NEW',
      }),
    )
    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
