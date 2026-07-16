import { PRESET_COLORS } from '@/components/cairn/markers-list'

/** Stable display color for a Sjodr when none is stored yet (Runir-like dots). */
export function resolveSjodrColor(
  fundId: string,
  color?: string | null,
): string {
  const trimmed = color?.trim()
  if (trimmed) return trimmed
  let hash = 0
  for (let i = 0; i < fundId.length; i++) {
    hash = (hash * 31 + fundId.charCodeAt(i)) >>> 0
  }
  return PRESET_COLORS[hash % PRESET_COLORS.length]!
}
