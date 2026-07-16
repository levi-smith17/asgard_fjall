import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { skattSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')

    if (!body.markerId || body.limit === undefined || body.month === undefined || body.year === undefined) {
      return toApiGatewayResponse(badRequest('markerId, limit, month, and year are required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = skattSk(body.markerId, body.month, body.year)

    const markerMap = await resolveRunirById(pk, [body.markerId as string])
    const marker = markerMap.get(body.markerId as string)

    const skatt = {
      pk,
      sk,
      id,
      markerId: body.markerId,
      markerName: body.markerName ?? marker?.name ?? '',
      limit: body.limit,
      month: body.month,
      year: body.year,
      ...(body.fundId ? { fundId: body.fundId } : {}),
    }

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: skatt,
      }),
    )

    return toApiGatewayResponse(created(skatt))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
