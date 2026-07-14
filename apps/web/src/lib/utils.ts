import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Lowercase and strip accents/diacritics for forgiving search/filter matching. */
export function foldSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
}

export function includesFoldedSearch(haystack: string, query: string): boolean {
  const needle = foldSearchText(query.trim())
  if (!needle) return true
  return foldSearchText(haystack).includes(needle)
}
