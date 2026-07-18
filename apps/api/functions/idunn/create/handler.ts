import { PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { idunnSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, created, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const body = JSON.parse(event.body ?? '{}')

    if (!body.name || body.amount === undefined || !body.billingCycle || !body.nextRenewal) {
      return toApiGatewayResponse(badRequest('name, amount, billingCycle, and nextRenewal are required'))
    }

    const pk = getPk(event)
    const id = randomUUID()
    const sk = idunnSk(id)

    const runMap = await resolveRunirById(pk, Array.isArray(body.runIds) ? body.runIds : [])
    const runir = [...runMap.values()]

    const idunn = {
      pk,
      sk,
      id,
      name: body.name,
      amount: body.amount,
      billingCycle: body.billingCycle,
      nextRenewal: body.nextRenewal,
      ...(body.url ? { url: body.url } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
      ...(body.fundId ? { fundId: body.fundId } : {}),
      active: body.active ?? true,
      runir,
      createdAt: new Date().toISOString(),
    }

    await dynamo.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: idunn,
      }),
    )

    return toApiGatewayResponse(created(idunn))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
