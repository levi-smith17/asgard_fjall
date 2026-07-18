import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from '../../shared/db'
import { getPathId, getPk } from '../../shared/auth'
import { surtrSk } from '../../shared/keys'
import { resolveRunirById } from '../../shared/runir-resolve'
import { toApiGatewayResponse, ok, badRequest, serverError } from '../../shared/response'

export const handler = async (
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
): Promise<APIGatewayProxyResultV2> => {
  try {
    const id = getPathId(event)

    if (!id) {
      return toApiGatewayResponse(badRequest('Missing burn id'))
    }

    const body = JSON.parse(event.body ?? '{}')
    const pk = getPk(event)
    const sk = surtrSk(id)

    const setExprs: string[] = []
    const removeExprs: string[] = []
    const exprNames: Record<string, string> = {}
    const exprValues: Record<string, unknown> = {}

    if ('name' in body) {
      setExprs.push('#name = :name')
      exprNames['#name'] = 'name'
      exprValues[':name'] = body.name
    }

    if ('amount' in body) {
      setExprs.push('amount = :amount')
      exprValues[':amount'] = body.amount
    }

    if ('date' in body) {
      setExprs.push('#date = :date')
      exprNames['#date'] = 'date'
      exprValues[':date'] = body.date
    }

    if ('notes' in body) {
      if (body.notes) {
        setExprs.push('notes = :notes')
        exprValues[':notes'] = body.notes
      } else {
        removeExprs.push('notes')
      }
    }

    if ('receiptUrl' in body) {
      if (body.receiptUrl) {
        setExprs.push('receiptUrl = :receiptUrl')
        exprValues[':receiptUrl'] = body.receiptUrl
      } else {
        removeExprs.push('receiptUrl')
      }
    }

    if ('runIds' in body) {
      const runMap = await resolveRunirById(pk, Array.isArray(body.runIds) ? body.runIds : [])
      setExprs.push('runir = :runir')
      exprValues[':runir'] = [...runMap.values()]
    }

    if ('fundId' in body) {
      if (body.fundId) {
        setExprs.push('fundId = :fundId')
        exprValues[':fundId'] = body.fundId
      } else {
        removeExprs.push('fundId')
      }
    }

    if (setExprs.length === 0 && removeExprs.length === 0) {
      return toApiGatewayResponse(badRequest('No valid fields to update'))
    }

    const parts: string[] = []
    if (setExprs.length > 0) parts.push(`SET ${setExprs.join(', ')}`)
    if (removeExprs.length > 0) parts.push(`REMOVE ${removeExprs.join(', ')}`)
    const UpdateExpression = parts.join(' ')

    const result = await dynamo.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { pk, sk },
        UpdateExpression,
        ...(Object.keys(exprNames).length > 0 ? { ExpressionAttributeNames: exprNames } : {}),
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW',
      }),
    )

    return toApiGatewayResponse(ok(result.Attributes))
  } catch (err) {
    console.error(err)
    return toApiGatewayResponse(serverError())
  }
}
