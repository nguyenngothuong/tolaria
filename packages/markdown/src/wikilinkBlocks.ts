const WL_START = '\u2039WIKILINK:'
const WL_END = '\u203A'
const WL_RE = /\u2039WIKILINK:([^\u203A]+)\u203A/g
const WIKILINK_RE = /\[\[([^\]]+)\]\]/g

interface BlockLike {
  content?: InlineItem[]
  children?: BlockLike[]
  [key: string]: unknown
}

interface InlineItem {
  type: string
  text?: string
  props?: Record<string, string>
  content?: unknown
  [key: string]: unknown
}

type ContentTransform = (content: InlineItem[]) => InlineItem[]

interface MarkdownLine {
  line: string
}

interface MarkdownTableCell {
  cell: string
}

interface TextSegmentInput {
  item: InlineItem
  text: string
}

interface WikilinkItemInput {
  target: string
}

/** Pre-process markdown: replace [[target]] with placeholder tokens. */
export function preProcessWikilinks(md: string): string {
  const lines = md.split('\n')
  const tableLines = findMarkdownTableLines(lines)
  return lines.map((line, index) => (
    tableLines[index] ? line : replaceWikilinksWithPlaceholders({ line })
  )).join('\n')
}

/** Walk blocks and replace placeholder text with wikilink inline content. */
export function injectWikilinks(blocks: unknown[]): unknown[] {
  return walkBlocks(blocks, expandWikilinksInContent)
}

/**
 * Deep-clone blocks and convert wikilink inline content back to [[target]] text.
 * This is the reverse of injectWikilinks, used before blocksToMarkdownLossy so
 * wikilinks survive the markdown round trip.
 */
export function restoreWikilinksInBlocks(blocks: unknown[]): unknown[] {
  return walkBlocks(blocks, collapseWikilinksInContent, true)
}

function replaceWikilinksWithPlaceholders({ line }: MarkdownLine): string {
  return line.replace(WIKILINK_RE, (_match, target) => `${WL_START}${target}${WL_END}`)
}

function findMarkdownTableLines(lines: string[]): boolean[] {
  const tableLines = lines.map(() => false)
  for (let index = 0; index < lines.length - 1; index++) {
    if (!isPotentialTableRow({ line: lines[index] }) || !isMarkdownTableSeparator({ line: lines[index + 1] })) {
      continue
    }

    tableLines[index] = true
    tableLines[index + 1] = true
    index = markTableBodyLines(lines, tableLines, index + 2) - 1
  }
  return tableLines
}

function markTableBodyLines(lines: string[], tableLines: boolean[], start: number): number {
  let index = start
  while (index < lines.length && isPotentialTableRow({ line: lines[index] })) {
    tableLines[index] = true
    index++
  }
  return index
}

function isPotentialTableRow({ line }: MarkdownLine): boolean {
  const trimmed = line.trim()
  return trimmed.includes('|') && trimmed !== '|'
}

function isMarkdownTableSeparator({ line }: MarkdownLine): boolean {
  const cells = splitTableCells({ line })
  return cells.length > 1 && cells.every((cell) => isMarkdownTableSeparatorCell({ cell }))
}

function splitTableCells({ line }: MarkdownLine): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim()).filter(Boolean)
}

function isMarkdownTableSeparatorCell({ cell }: MarkdownTableCell): boolean {
  return /^:?-{3,}:?$/.test(cell)
}

function walkBlocks(blocks: unknown[], transform: ContentTransform, clone = false): unknown[] {
  return (blocks as BlockLike[]).map((block) => walkBlock(block, transform, clone))
}

function walkBlock(block: BlockLike, transform: ContentTransform, clone: boolean): BlockLike {
  const nextBlock = clone ? { ...block } : block

  if (Array.isArray(nextBlock.content)) {
    nextBlock.content = transform(nextBlock.content)
  }

  if (Array.isArray(nextBlock.children)) {
    nextBlock.children = walkBlocks(nextBlock.children, transform, clone) as BlockLike[]
  }

  return nextBlock
}

function textSegment({ item, text }: TextSegmentInput): InlineItem {
  return { ...item, text }
}

function wikilinkItem({ target }: WikilinkItemInput): InlineItem {
  return {
    type: 'wikilink',
    props: { target },
    content: undefined,
  }
}

function expandWikilinksInContent(content: InlineItem[]): InlineItem[] {
  return content.flatMap(expandWikilinksInItem)
}

function expandWikilinksInItem(item: InlineItem): InlineItem[] {
  if (!isPlaceholderTextItem(item)) {
    return [item]
  }

  const result: InlineItem[] = []
  let lastIndex = 0
  WL_RE.lastIndex = 0

  let match
  while ((match = WL_RE.exec(item.text)) !== null) {
    if (match.index > lastIndex) {
      result.push(textSegment({ item, text: item.text.slice(lastIndex, match.index) }))
    }
    result.push(wikilinkItem({ target: match[1] }))
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < item.text.length) {
    result.push(textSegment({ item, text: item.text.slice(lastIndex) }))
  }

  return result
}

function isPlaceholderTextItem(item: InlineItem): item is InlineItem & { text: string } {
  return item.type === 'text' && typeof item.text === 'string' && item.text.includes(WL_START)
}

function collapseWikilinksInContent(content: InlineItem[]): InlineItem[] {
  return content.map((item) => {
    if (item.type === 'wikilink' && item.props?.target) {
      return { type: 'text', text: `[[${item.props.target}]]` }
    }

    return item
  })
}
