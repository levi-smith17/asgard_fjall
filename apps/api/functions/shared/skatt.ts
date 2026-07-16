import { SKATT_PREFIX } from './keys'

/** Port of Cairn `shared/cache.ts` — composite id is the sk with the `SKATT#` prefix stripped. */
export function skattCompositeId(item: { sk: string; id?: string }): string {
  return item.id ?? item.sk.replace(new RegExp(`^${SKATT_PREFIX}`), '')
}

export function findSkattById<T extends { sk: string; id?: string }>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => skattCompositeId(item) === id)
}
