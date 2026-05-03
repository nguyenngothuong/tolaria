import { splitFrontmatter } from './frontmatter'
import { wikilinkTarget } from './wikilinkText'

interface ParagraphMatchInput {
  paragraph: string
  matchTargets: Set<string>
}

interface TruncateContextInput {
  context: string
  maxLength: number
}

export function extractBacklinkContext(
  content: string,
  matchTargets: Set<string>,
  maxLength = 120,
): string | null {
  const [, body] = splitFrontmatter(content)
  const withoutTitle = body.replace(/^\s*# [^\n]+\n?/, '')

  for (const paragraph of withoutTitle.split(/\n{2,}/)) {
    const context = findBacklinkContextInParagraph({ paragraph, matchTargets })
    if (context !== null) {
      return truncateContext({ context, maxLength })
    }
  }

  return null
}

function findBacklinkContextInParagraph({ paragraph, matchTargets }: ParagraphMatchInput): string | null {
  const trimmed = paragraph.trim()
  if (!trimmed) {
    return null
  }

  const re = /\[\[([^\]]+)\]\]/g
  let match

  while ((match = re.exec(trimmed)) !== null) {
    const target = wikilinkTarget({ inner: match[1] })
    const basename = target.split('/').pop() ?? ''
    if (matchTargets.has(target) || matchTargets.has(basename)) {
      return trimmed.replace(/\s+/g, ' ')
    }
  }

  return null
}

function truncateContext({ context, maxLength }: TruncateContextInput): string {
  if (context.length <= maxLength) {
    return context
  }

  return context.slice(0, maxLength - 1) + '\u2026'
}
