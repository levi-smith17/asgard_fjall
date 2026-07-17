import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerResult,
} from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { hashApiToken, isApiToken, tokenLookupPk } from '../../shared/api-token'
import { isFjallSessionToken, parseFjallSessionToken } from '../../shared/fjall-session'

const fjallSessionSecret = process.env.FJALL_SESSION_SECRET?.trim()

function extractBearerToken(event: APIGatewayRequestAuthorizerEventV2): string | null {
  const fromHeader = parseBearerToken(
    event.headers?.authorization ?? event.headers?.Authorization,
  )
  if (fromHeader) return fromHeader

  for (const source of event.identitySource ?? []) {
    const fromSource = parseBearerToken(source)
    if (fromSource) return fromSource
  }

  return null
}

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const trimmed = header.trim()
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed)
  if (bearerMatch?.[1]) return bearerMatch[1]
  if (/^csk_/.test(trimmed) || /^v1\./.test(trimmed)) {
    return trimmed
  }
  return null
}

async function verifyApiToken(token: string): Promise<{ sub: string }> {
  const lookup = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        pk: tokenLookupPk(token),
        sk: 'META',
      },
    }),
  )

  const userId = lookup.Item?.userId
  if (typeof userId !== 'string' || !userId) {
    throw new Error('Invalid API token')
  }

  const tokenHash = hashApiToken(token)
  await dynamo
    .send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          pk: `USER#${userId}`,
          sk: 'API_TOKEN',
        },
        UpdateExpression: 'SET lastUsedAt = :lastUsedAt',
        ConditionExpression: 'tokenHash = :tokenHash',
        ExpressionAttributeValues: {
          ':lastUsedAt': new Date().toISOString(),
          ':tokenHash': tokenHash,
        },
      }),
    )
    .catch(() => {
      // Ignore races or missing user record — lookup already validated token existence.
    })

  return { sub: userId }
}

export const handler = async (
  event: APIGatewayRequestAuthorizerEventV2,
): Promise<APIGatewaySimpleAuthorizerResult> => {
  try {
    const token = extractBearerToken(event)
    if (!token) {
      console.warn('Authorizer denied: missing bearer token')
      return { isAuthorized: false }
    }

    if (isApiToken(token)) {
      const user = await verifyApiToken(token)
      return {
        isAuthorized: true,
        context: {
          sub: user.sub,
          authType: 'api_token',
        },
      } as APIGatewaySimpleAuthorizerResult
    }

    if (isFjallSessionToken(token)) {
      if (!fjallSessionSecret) {
        console.error('Authorizer denied: FJALL_SESSION_SECRET not configured')
        return { isAuthorized: false }
      }
      const user = parseFjallSessionToken(fjallSessionSecret, token)
      return {
        isAuthorized: true,
        context: {
          sub: user.sub,
          email: user.email,
          authType: 'fjall_session',
        },
      } as APIGatewaySimpleAuthorizerResult
    }

    console.warn('Authorizer denied: unrecognized token type')
    return { isAuthorized: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('Authorizer failed', message)
    return { isAuthorized: false }
  }
}
