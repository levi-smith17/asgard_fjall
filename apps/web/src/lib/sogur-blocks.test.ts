import { describe, expect, it } from 'vitest'
import {
  htmlToPlainText,
  parseSogurBlocks,
  serializeSogurBlocks,
  sogurBlocksToHtml,
  sogurBlocksToPlainText,
  type SogurBlockDocument,
} from './sogur-blocks'

describe('Sogur block content', () => {
  it('parses legacy HTML as one rich-text block', () => {
    const document = parseSogurBlocks('<h2>Legacy</h2><p>Entry</p>')

    expect(document.version).toBe(1)
    expect(document.blocks).toHaveLength(1)
    expect(document.blocks[0]).toMatchObject({
      type: 'rich-text',
      content: '<h2>Legacy</h2><p>Entry</p>',
    })
    expect(document.blocks[0]?.id).toBeTruthy()
  })

  it('round-trips valid JSON while preserving stable ids', () => {
    const document: SogurBlockDocument = {
      version: 1,
      blocks: [
        { id: 'intro', type: 'heading', content: '<h2>North</h2>' },
        { id: 'rule', type: 'divider' },
        { id: 'photo', type: 'image', src: 'https://example.com/north.jpg', alt: 'North' },
      ],
    }

    expect(parseSogurBlocks(serializeSogurBlocks(document))).toEqual(document)
  })

  it('normalizes invalid and duplicate blocks with a safe fallback', () => {
    const document = parseSogurBlocks(
      JSON.stringify({
        blocks: [
          { id: 'same', type: 'rich-text', content: '<p>One</p>' },
          { id: 'same', type: 'divider' },
          { id: 'ignored', type: 'unknown' },
        ],
      }),
    )

    expect(document.blocks).toHaveLength(2)
    expect(document.blocks[0]?.id).toBe('same')
    expect(document.blocks[1]?.id).not.toBe('same')
    expect(parseSogurBlocks('{"blocks":[{"type":"unknown"}]}').blocks[0]?.type).toBe('rich-text')
  })

  it('flattens blocks to HTML and searchable plain text', () => {
    const document: SogurBlockDocument = {
      version: 1,
      blocks: [
        { id: 'heading', type: 'heading', content: '<h2>Field &amp; Stream</h2>' },
        { id: 'body', type: 'rich-text', content: '<p>Hello <strong>world</strong>.</p><ul><li>One</li><li>Two</li></ul>' },
        { id: 'image', type: 'image', src: 'https://example.com/a.jpg', alt: 'Map', caption: 'Route' },
      ],
    }

    expect(sogurBlocksToHtml(document)).toContain('<img src="https://example.com/a.jpg" alt="Map">')
    expect(sogurBlocksToPlainText(document)).toBe(
      'Field & Stream\n\nHello world.\n• One\n• Two\n\nMap Route',
    )
  })

  it('converts HTML to plain text without scripts', () => {
    expect(htmlToPlainText('<p>A&nbsp;B<br>C</p><script>bad()</script>')).toBe('A B\nC')
  })
})
