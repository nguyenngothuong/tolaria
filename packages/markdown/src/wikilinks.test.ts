import { describe, expect, it } from 'vitest'
import {
  countWords,
  extractBacklinkContext,
  extractOutgoingLinks,
  extractSnippet,
  injectWikilinks,
  preProcessWikilinks,
  restoreWikilinksInBlocks,
  splitFrontmatter,
} from './index'

interface TestBlock {
  type?: string
  text?: string
  content?: TestBlock[]
  children?: TestBlock[]
  props?: Record<string, string>
  href?: string
  [key: string]: unknown
}

describe('wikilink markdown preprocessing', () => {
  it('replaces wikilinks outside markdown tables with placeholder tokens', () => {
    const markdown = [
      '| Topic | Reference |',
      '| --- | --- |',
      '| [[Project Alpha]] | [[Project Beta]] |',
      '',
      'Outside [[Project Gamma]]',
    ].join('\n')

    const result = preProcessWikilinks(markdown)

    expect(result).toContain('| [[Project Alpha]] | [[Project Beta]] |')
    expect(result).toContain('WIKILINK:Project Gamma')
    expect(result).not.toContain('WIKILINK:Project Alpha')
  })

  it('converts placeholder text nodes into wikilink inline nodes', () => {
    const blocks = [{
      content: [
        { type: 'text', text: '\u2039WIKILINK:My Note\u203A after' },
      ],
    }]

    const result = injectWikilinks(blocks) as TestBlock[]

    expect(result[0].content).toEqual([
      { type: 'wikilink', props: { target: 'My Note' }, content: undefined },
      { type: 'text', text: ' after' },
    ])
  })

  it('restores wikilink inline nodes to markdown text without mutating input blocks', () => {
    const blocks = [{
      content: [
        { type: 'text', text: 'See ' },
        { type: 'wikilink', props: { target: 'My Note' }, content: undefined },
      ],
    }]

    const result = restoreWikilinksInBlocks(blocks) as TestBlock[]

    expect(result[0].content).toEqual([
      { type: 'text', text: 'See ' },
      { type: 'text', text: '[[My Note]]' },
    ])
    expect(blocks[0].content[1].type).toBe('wikilink')
  })
})

describe('frontmatter helpers', () => {
  it('splits YAML frontmatter from body', () => {
    const content = '---\ntitle: Hello\n---\n\n# Hello\n'
    expect(splitFrontmatter(content)).toEqual([
      '---\ntitle: Hello\n---\n',
      '\n# Hello\n',
    ])
  })

  it('returns the whole document as body when frontmatter is missing or unclosed', () => {
    expect(splitFrontmatter('# No Frontmatter')).toEqual(['', '# No Frontmatter'])
    expect(splitFrontmatter('---\ntitle: Hello\nNo closing')).toEqual([
      '',
      '---\ntitle: Hello\nNo closing',
    ])
  })
})

describe('content summaries', () => {
  it('extracts sorted and deduplicated outgoing wikilink targets', () => {
    const content = 'See [[B]] and [[A]] and [[project/c|Project C]] and [[B]].'
    expect(extractOutgoingLinks(content)).toEqual(['A', 'B', 'project/c'])
  })

  it('extracts backlink context and matches by final path segment', () => {
    const content = '---\ntitle: Test\n---\n\n# Test\n\nSee [[project/My Note]] for details.'
    expect(extractBacklinkContext(content, new Set(['My Note']))).toBe('See [[project/My Note]] for details.')
  })

  it('truncates backlink context with a single unicode ellipsis', () => {
    const content = `# Test\n\n${'A'.repeat(80)} [[Target]] ${'B'.repeat(80)}`
    const result = extractBacklinkContext(content, new Set(['Target']), 40)

    expect(result).toHaveLength(40)
    expect(result?.endsWith('\u2026')).toBe(true)
  })

  it('extracts snippet text from markdown body content', () => {
    const content = '# Title\n\nSome **bold** text with [a link](https://example.com) and [[Note|alias]].'
    expect(extractSnippet(content)).toBe('Some bold text with a link and alias.')
  })

  it('falls back to subheading text when the note has no paragraph content', () => {
    const content = '# Title\n\n## Section One\n\n### Section Two\n'
    expect(extractSnippet(content)).toBe('Section One Section Two')
  })

  it('counts body words while excluding the title and wikilinks', () => {
    const content = '---\ntitle: Test\n---\n\n# Test\n\nSee [[My Note]] for details.'
    expect(countWords(content)).toBe(3)
  })
})
