import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { IDUNN_PREFIX, idFromSk } from '../../shared/keys'
import { withCanonicalDomainAttrs } from '../../shared/legacy-attrs'
import { toApiGatewayResponse, ok, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)
    const params = event.queryStringParameters ?? {}

    const result = await dynamo.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':prefix': IDUNN_PREFIX,
        },
      }),
    )

    let items = result.Items ?? []

    if (params.search) {
      const term = params.search.toLowerCase()
      items = items.filter((p) => String(p.name).toLowerCase().includes(term))
    }

    if (params.runId) {
      items = items.filter((p) =>
        (p.runir ?? p.markers ?? []).some((m: { id?: string }) => m.id === params.runId),
      )
    }

    if (params.active !== undefined) {
      const activeFilter = params.active === 'true'
      items = items.filter((p) => p.active === activeFilter)
    }

    const idunn = items.map((p) => ({
      ...withCanonicalDomainAttrs(p),
      id: idFromSk(String(p.sk), IDUNN_PREFIX),
    }))

    return toApiGatewayResponse(ok(idunn))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
