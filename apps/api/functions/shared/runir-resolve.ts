import { BatchGetCommand } from '@aws-sdk/lib-dynamodb'
import { dynamo, TABLE_NAME } from './db'
import { runSk, idFromSk, RUN_PREFIX } from './keys'

export interface ResolvedRun {
  id: string
  name: string
  color: string
  icon?: string
}

/** Port of Cairn `shared/markers.ts#resolveMarkersById`, remapped to `RUN#` keys. */
export async function resolveRunirById(
  pk: string,
  runIds: string[],
): Promise<Map<string, ResolvedRun>> {
  const unique = [...new Set(runIds.filter(Boolean))]
  if (!unique.length) return new Map()

  const result = await dynamo.send(
    new BatchGetCommand({
      RequestItems: {
        [TABLE_NAME]: {
          Keys: unique.map((id) => ({ pk, sk: runSk(id) })),
        },
      },
    }),
  )

  const map = new Map<string, ResolvedRun>()
  for (const item of result.Responses?.[TABLE_NAME] ?? []) {
    const id = idFromSk(String(item.sk), RUN_PREFIX)
    map.set(id, {
      id,
      name: item.name as string,
      color: item.color as string,
      ...(item.icon ? { icon: item.icon as string } : {}),
    })
  }
  return map
}
