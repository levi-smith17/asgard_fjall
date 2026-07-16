import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { surtrSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')

    if (!body.name || body.amount === undefined || !body.date) {
      return toApiGatewayResponse(badRequest('name, amount, and date are required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = surtrSk(id)

    const markerMap = await resolveRunirById(pk, Array.isArray(body.markerIds) ? body.markerIds : [])
    const markers = [...markerMap.values()]

    const surtr = {
      pk,
      sk,
      id,
      name: body.name,
      amount: body.amount,
      date: body.date,
      ...(body.notes ? { notes: body.notes } : {}),
      ...(body.receiptUrl ? { receiptUrl: body.receiptUrl } : {}),
      ...(body.fundId ? { fundId: body.fundId } : {}),
      markers,
      createdAt: new Date().toISOString(),
    }

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: surtr,
      }),
    )

    return toApiGatewayResponse(created(surtr))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
