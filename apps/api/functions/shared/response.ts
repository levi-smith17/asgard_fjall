export type ApiResponse<T> = {
  statusCode: number
  data?: T
  error?: string
}

export function ok<T>(data: T): ApiResponse<T> {
  return { statusCode: 200, data }
}

export function toApiGatewayResponse<T>(
  response: ApiResponse<T>,
): {
  statusCode: number
  headers: Record<string, string>
  body: string
} {
  return {
    statusCode: response.statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(
      response.error !== undefined
        ? { error: response.error }
        : response.data !== undefined
          ? response.data
          : {},
    ),
  }
}
