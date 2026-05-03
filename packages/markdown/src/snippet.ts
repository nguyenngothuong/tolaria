import { splitFrontmatter } from './frontmatter'
import { wikilinkDisplayText } from './wikilinkText'

const FORMAT_MARKERS = new Set(['*', '_', '`', '~'])

interface MarkdownTextCursor {
  markdown: string
  index: number
}

interface TextReadResult {
  text: string
  nextIndex: number
}

interface SequenceReadInput {
  value: string
  start: number
  sequence: string
}

interface CharacterReadInput {
  value: string
  start: number
  char: string
}

interface MarkdownLine {
  line: string
}

interface MarkdownBody {
  body: string
}

interface SnippetText {
  snippet: string
}

export function extractSnippet(content: string): string {
  const [, body] = splitFrontmatter(content)
  const withoutH1 = removeH1Line({ body })
  const snippet = paragraphSnippet({ body: withoutH1 }) || headingSnippet({ body: withoutH1 })
  return truncateSnippet({ snippet })
}

function isSnippetLine({ line }: MarkdownLine): boolean {
  const trimmed = line.trim()
  return trimmed !== '' && !trimmed.startsWith('#') && !trimmed.startsWith('```') && !trimmed.startsWith('---')
}

function stripListMarker({ line }: MarkdownLine): string {
  const trimmed = line.trimStart()
  const bullet = ['* ', '- ', '+ '].find((prefix) => trimmed.startsWith(prefix))
  if (bullet) {
    return trimmed.slice(bullet.length)
  }

  const dotPosition = trimmed.indexOf('. ')
  if (isOrderedListMarker({ line: trimmed, dotPosition })) {
    return trimmed.slice(dotPosition + 2)
  }

  return trimmed
}

function isOrderedListMarker({ line, dotPosition }: { line: string, dotPosition: number }): boolean {
  return dotPosition >= 1 && dotPosition <= 3 && /^\d+$/.test(line.slice(0, dotPosition))
}

function removeH1Line({ body }: MarkdownBody): string {
  const lines = body.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('# ')) {
      return lines.slice(i + 1).join('\n')
    }

    if (lines[i].trim() !== '') {
      return body
    }
  }

  return body
}

function stripMarkdownChars(markdown: string): string {
  let result = ''
  let index = 0

  while (index < markdown.length) {
    const next = readMarkdownText({ markdown, index })
    result += next.text
    index = next.nextIndex
  }

  return result
}

function readMarkdownText({ markdown, index }: MarkdownTextCursor): TextReadResult {
  if (markdown.startsWith('[[', index)) {
    const parsed = readUntilSequence({ value: markdown, start: index + 2, sequence: ']]' })
    return {
      text: wikilinkDisplayText({ inner: parsed.text }),
      nextIndex: parsed.nextIndex,
    }
  }

  if (markdown[index] === '[') {
    const parsed = readUntilChar({ value: markdown, start: index + 1, char: ']' })
    return {
      text: parsed.text,
      nextIndex: skipMarkdownLinkDestination({ value: markdown, start: parsed.nextIndex }),
    }
  }

  if (FORMAT_MARKERS.has(markdown[index])) {
    return { text: '', nextIndex: index + 1 }
  }

  return { text: markdown[index], nextIndex: index + 1 }
}

function readUntilSequence({ value, start, sequence }: SequenceReadInput): TextReadResult {
  const end = value.indexOf(sequence, start)
  if (end === -1) {
    return { text: value.slice(start), nextIndex: value.length }
  }

  return { text: value.slice(start, end), nextIndex: end + sequence.length }
}

function readUntilChar({ value, start, char }: CharacterReadInput): TextReadResult {
  const end = value.indexOf(char, start)
  if (end === -1) {
    return { text: value.slice(start), nextIndex: value.length }
  }

  return { text: value.slice(start, end), nextIndex: end + 1 }
}

function skipMarkdownLinkDestination({ value, start }: { value: string, start: number }): number {
  if (value[start] !== '(') {
    return start
  }

  const end = value.indexOf(')', start + 1)
  return end === -1 ? value.length : end + 1
}

function extractSubheadingText({ line }: MarkdownLine): string | null {
  const trimmed = line.trim()
  const stripped = trimmed.replace(/^#+/, '')

  if (stripped.length < trimmed.length && stripped.startsWith(' ')) {
    const text = stripped.trim()
    return text || null
  }

  return null
}

function paragraphSnippet({ body }: MarkdownBody): string {
  const clean = body.split('\n')
    .filter((line) => isSnippetLine({ line }))
    .map((line) => stripListMarker({ line }))
    .join(' ')
  return stripMarkdownChars(clean).trim()
}

function headingSnippet({ body }: MarkdownBody): string {
  const headingText = body.split('\n')
    .map((line) => extractSubheadingText({ line }))
    .filter((text): text is string => text !== null)
    .join(' ')

  return stripMarkdownChars(headingText).trim()
}

function truncateSnippet({ snippet }: SnippetText): string {
  if (snippet.length <= 160) {
    return snippet
  }

  return snippet.slice(0, 160) + '...'
}
