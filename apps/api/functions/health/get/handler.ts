import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { ok, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  _event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  return toApiGatewayResponse(
    ok({
      status: 'ok',
      environment: process.env.ENVIRONMENT ?? 'unknown',
      service: process.env.SERVICE ?? 'asgard-fjall-api',
    }),
  )
}
