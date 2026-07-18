export const SOGUR_BLOCKS_VERSION = 1 as const

export type SogurBlockType = 'rich-text' | 'heading' | 'quote' | 'code' | 'divider' | 'image'

type SogurTextBlock = {
  id: string
  type: 'rich-text' | 'heading' | 'quote' | 'code'
  content: string
}

export type SogurDividerBlock = {
  id: string
  type: 'divider'
}

export type SogurImageBlock = {
  id: string
  type: 'image'
  src: string
  alt: string
  caption?: string
}

export type SogurBlock = SogurTextBlock | SogurDividerBlock | SogurImageBlock

export type SogurBlockDocument = {
  version: typeof SOGUR_BLOCKS_VERSION
  blocks: SogurBlock[]
}

const blockTypes = new Set<SogurBlockType>([
  'rich-text',
  'heading',
  'quote',
  'code',
  'divider',
  'image',
])

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sogur-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

function emptyContent(type: SogurBlockType): string {
  if (type === 'heading') return '<h2></h2>'
  if (type === 'quote') return '<blockquote><p></p></blockquote>'
  if (type === 'code') return '<pre><code></code></pre>'
  return '<p></p>'
}

export function createSogurBlock(type: SogurBlockType): SogurBlock {
  const id = createId()
  if (type === 'divider') return { id, type }
  if (type === 'image') return { id, type, src: '', alt: '' }
  return { id, type, content: emptyContent(type) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeId(value: unknown, ids: Set<string>): string {
  const candidate = typeof value === 'string' ? value.trim() : ''
  const id = candidate && !ids.has(candidate) ? candidate : createId()
  ids.add(id)
  return id
}

function normalizeBlock(value: unknown, ids: Set<string>): SogurBlock | null {
  if (!isRecord(value) || typeof value.type !== 'string' || !blockTypes.has(value.type as SogurBlockType)) {
    return null
  }

  const type = value.type as SogurBlockType
  const id = normalizeId(value.id, ids)
  if (type === 'divider') return { id, type }
  if (type === 'image') {
    return {
      id,
      type,
      src: typeof value.src === 'string' ? value.src : '',
      alt: typeof value.alt === 'string' ? value.alt : '',
      ...(typeof value.caption === 'string' ? { caption: value.caption } : {}),
    }
  }
  return {
    id,
    type,
    content: typeof value.content === 'string' ? value.content : emptyContent(type),
  }
}

function legacyDocument(html: string): SogurBlockDocument {
  return {
    version: SOGUR_BLOCKS_VERSION,
    blocks: [
      {
        id: createId(),
        type: 'rich-text',
        content: html.trim() ? html : '<p></p>',
      },
    ],
  }
}

/**
 * Parses persisted Sogur content. Legacy HTML becomes one rich-text block;
 * malformed or partially valid JSON is safely normalized into a usable document.
 */
export function parseSogurBlocks(value: string | null | undefined): SogurBlockDocument {
  const source = value ?? ''
  const trimmed = source.trim()
  if (!trimmed) return legacyDocument('')

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      const candidates = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed.blocks)
          ? parsed.blocks
          : null
      if (candidates) {
        const ids = new Set<string>()
        const blocks = candidates
          .map((block) => normalizeBlock(block, ids))
          .filter((block): block is SogurBlock => block !== null)
        return {
          version: SOGUR_BLOCKS_VERSION,
          blocks: blocks.length ? blocks : [createSogurBlock('rich-text')],
        }
      }
    } catch {
      // Preserve unparseable persisted content as a legacy rich-text value.
    }
  }

  return legacyDocument(source)
}

export function serializeSogurBlocks(
  documentOrBlocks: SogurBlockDocument | readonly SogurBlock[],
): string {
  const candidates = Array.isArray(documentOrBlocks)
    ? documentOrBlocks
    : (documentOrBlocks as SogurBlockDocument).blocks
  const ids = new Set<string>()
  const blocks = candidates
    .map((block) => normalizeBlock(block, ids))
    .filter((block): block is SogurBlock => block !== null)
  return JSON.stringify({
    version: SOGUR_BLOCKS_VERSION,
    blocks: blocks.length ? blocks : [createSogurBlock('rich-text')],
  })
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export function sogurBlocksToHtml(documentOrBlocks: SogurBlockDocument | readonly SogurBlock[]): string {
  const blocks = Array.isArray(documentOrBlocks)
    ? documentOrBlocks
    : (documentOrBlocks as SogurBlockDocument).blocks
  return blocks
    .map((block) => {
      if (block.type === 'divider') return '<hr>'
      if (block.type === 'image') {
        if (!block.src) return ''
        const image = `<img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(block.alt)}">`
        return block.caption
          ? `<figure>${image}<figcaption>${escapeAttribute(block.caption)}</figcaption></figure>`
          : image
      }
      return block.content
    })
    .filter(Boolean)
    .join('\n')
}

const namedEntities: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
}

function decodeEntities(value: string): string {
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const hex = code[1]?.toLowerCase() === 'x'
      const number = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10)
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity
    }
    return namedEntities[code.toLowerCase()] ?? entity
  })
}

export function htmlToPlainText(html: string): string {
  return decodeEntities(
    html
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|blockquote|pre|li|figure|figcaption)>/gi, '\n')
      .replace(/<li\b[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function sogurBlocksToPlainText(
  documentOrBlocks: SogurBlockDocument | readonly SogurBlock[],
): string {
  const blocks = Array.isArray(documentOrBlocks)
    ? documentOrBlocks
    : (documentOrBlocks as SogurBlockDocument).blocks
  return blocks
    .map((block) => {
      if (block.type === 'divider') return ''
      if (block.type === 'image') return [block.alt, block.caption].filter(Boolean).join(' ')
      return htmlToPlainText(block.content)
    })
    .filter(Boolean)
    .join('\n\n')
}
