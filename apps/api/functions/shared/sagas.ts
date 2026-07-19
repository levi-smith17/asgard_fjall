import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from './db'
import { idFromSk, SAGA_PREFIX, sagaSk, sogurSk } from './keys'

export type SagaRecord = {
  pk: string
  sk: string
  name: string
  greinId?: string | null
  runir?: unknown[]
  orderedThattrIds?: string[]
  createdAt?: string
  updatedAt?: string
}

export async function getSaga(pk: string, sagaId: string): Promise<SagaRecord | null> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: sagaSk(sagaId) },
    }),
  )
  return (result.Item as SagaRecord | undefined) ?? null
}

export function sagaIdFromRecord(saga: SagaRecord): string {
  return idFromSk(saga.sk, SAGA_PREFIX)
}

export function sagaGreinId(saga: Pick<SagaRecord, 'greinId'>): string | null {
  const value = saga.greinId
  return typeof value === 'string' && value.length > 0 ? value : null
}

/** Append a Thattr id to the saga order (idempotent if already present). */
export async function appendThattrToSagaOrder(
  pk: string,
  sagaId: string,
  thattrId: string,
): Promise<void> {
  const saga = await getSaga(pk, sagaId)
  if (!saga) return

  const ordered = Array.isArray(saga.orderedThattrIds) ? saga.orderedThattrIds : []
  if (ordered.includes(thattrId)) return

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: sagaSk(sagaId) },
      UpdateExpression:
        'SET orderedThattrIds = list_append(if_not_exists(orderedThattrIds, :empty), :ids), updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':empty': [],
        ':ids': [thattrId],
        ':updatedAt': new Date().toISOString(),
      },
    }),
  )
}

/** Remove a Thattr id from the saga order. */
export async function removeThattrFromSagaOrder(
  pk: string,
  sagaId: string,
  thattrId: string,
): Promise<void> {
  const saga = await getSaga(pk, sagaId)
  if (!saga) return

  const ordered = Array.isArray(saga.orderedThattrIds) ? saga.orderedThattrIds : []
  const next = ordered.filter((id) => id !== thattrId)
  if (next.length === ordered.length) return

  await dynamo.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { pk, sk: sagaSk(sagaId) },
      UpdateExpression: 'SET orderedThattrIds = :ordered, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':ordered': next,
        ':updatedAt': new Date().toISOString(),
      },
    }),
  )
}

/** Detach all Thattr in orderedThattrIds: clear sagaId, keep greinId. */
export async function detachSagaThattr(
  pk: string,
  orderedThattrIds: string[],
): Promise<void> {
  const unique = [...new Set(orderedThattrIds.filter(Boolean))]
  await Promise.all(
    unique.map((thattrId) =>
      dynamo.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { pk, sk: sogurSk(thattrId) },
          UpdateExpression: 'REMOVE sagaId SET updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':updatedAt': new Date().toISOString(),
          },
        }),
      ),
    ),
  )
}

/** Propagate saga greinId (or clear) onto all ordered Thattr. */
export async function propagateSagaGreinId(
  pk: string,
  orderedThattrIds: string[],
  greinId: string | null,
): Promise<void> {
  const unique = [...new Set(orderedThattrIds.filter(Boolean))]
  const now = new Date().toISOString()

  await Promise.all(
    unique.map((thattrId) => {
      if (greinId) {
        return dynamo.send(
          new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { pk, sk: sogurSk(thattrId) },
            UpdateExpression: 'SET greinId = :greinId, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
              ':greinId': greinId,
              ':updatedAt': now,
            },
          }),
        )
      }
      return dynamo.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: { pk, sk: sogurSk(thattrId) },
          UpdateExpression: 'REMOVE greinId SET updatedAt = :updatedAt',
          ExpressionAttributeValues: { ':updatedAt': now },
        }),
      )
    }),
  )
}
