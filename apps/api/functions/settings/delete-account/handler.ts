import { BatchWriteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPk, getUserId } from '../../shared/auth'
import { noContent, serverError, toApiGatewayResponse } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const pk = getPk(event)
    const userId = getUserId(event)

    const allItems: { pk: string; sk: string }[] = []
    let lastKey: Record<string, unknown> | undefined

    do {
      const result = await dynamo.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: 'pk = :pk',
          ExpressionAttributeValues: { ':pk': pk },
          ProjectionExpression: 'pk, sk',
          ExclusiveStartKey: lastKey,
        }),
      )
      for (const item of result.Items ?? []) {
        allItems.push({ pk: item.pk as string, sk: item.sk as string })
      }
      lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined
    } while (lastKey)

    const chunks: { pk: string; sk: string }[][] = []
    for (let i = 0; i < allItems.length; i += 25) {
      chunks.push(allItems.slice(i, i + 25))
    }

    await Promise.all(
      chunks.map((chunk) =>
        dynamo.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: chunk.map((item) => ({
                DeleteRequest: { Key: { pk: item.pk, sk: item.sk } },
              })),
            },
          }),
        ),
      ),
    )

    // Cognito AdminDeleteUser only works once the pool lives in asgard (or via
    // cross-account IAM). Until then, Dynamo wipe still succeeds.
    const poolId = process.env.COGNITO_USER_POOL_ID
    if (poolId) {
      try {
        const cognito = new CognitoIdentityProviderClient({
          region: process.env.AWS_REGION ?? 'us-east-2',
        })
        await cognito.send(
          new AdminDeleteUserCommand({
            UserPoolId: poolId,
            Username: userId,
          }),
        )
      } catch (err) {
        console.warn('Cognito user delete skipped/failed', err)
      }
    }

    return toApiGatewayResponse(noContent())
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
