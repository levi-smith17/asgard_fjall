import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda'
import { createAuthApp } from './app.js'

const app = createAuthApp()

function toRequest(event: APIGatewayProxyEventV2): Request {
  const proto = event.headers['x-forwarded-proto'] ?? 'https'
  const host = event.headers.host ?? 'localhost'
  const path = event.rawPath || '/'
  const query = event.rawQueryString ? `?${event.rawQueryString}` : ''
  const url = `${proto}://${host}${path}${query}`

  const headers = new Headers()
  for (const [key, value] of Object.entries(event.headers)) {
    if (value) headers.set(key, value)
  }

  const method = event.requestContext.http.method
  const body =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : event.isBase64Encoded
        ? Buffer.from(event.body ?? '', 'base64')
        : (event.body ?? undefined)

  return new Request(url, { method, headers, body })
}

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const response = await app.fetch(toRequest(event))
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    // Function URL supports multiple Set-Cookie via array in some runtimes;
    // string join is fine for a single session cookie.
    if (key.toLowerCase() === 'set-cookie') {
      headers[key] = value
    } else {
      headers[key] = value
    }
  })

  const setCookies = typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
    ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
    : []

  return {
    statusCode: response.status,
    headers,
    cookies: setCookies.length > 0 ? setCookies : undefined,
    body: await response.text(),
  }
}
