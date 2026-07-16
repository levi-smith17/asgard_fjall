import { QueryCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk } from '../../shared/auth'
import { LAUF_PREFIX, RUN_PREFIX, idFromSk } from '../../shared/keys'
import { ok, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)
    const [runirResult, laufarResult] = await Promise.all([
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': RUN_PREFIX },
        }),
      ),
      dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
          ExpressionAttributeValues: { ':pk': pk, ':prefix': LAUF_PREFIX },
        }),
      ),
    ])

    const laufarCounts = new Map<string, number>()
    for (const lauf of laufarResult.Items ?? []) {
      for (const run of (lauf.runir ?? []) as Array<{ id?: string }>) {
        if (!run.id) continue
        laufarCounts.set(run.id, (laufarCounts.get(run.id) ?? 0) + 1)
      }
    }

    const runir = (runirResult.Items ?? []).map((item) => ({
      ...item,
      laufarCount: laufarCounts.get(idFromSk(String(item.sk), RUN_PREFIX)) ?? 0,
    }))

    return toApiGatewayResponse(ok(runir))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
