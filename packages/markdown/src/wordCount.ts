import { splitFrontmatter } from './frontmatter'

export function countWords(content: string): number {
  const [, body] = splitFrontmatter(content)
  const withoutTitle = body.replace(/^\s*# [^\n]+\n?/, '')
  const withoutWikilinks = withoutTitle.replace(/\[\[[^\]]*\]\]/g, '')
  const text = withoutWikilinks.replace(/[#*_[\]`>~\-|]/g, '').trim()

  if (!text) {
    return 0
  }

  return text.split(/\s+/).filter(Boolean).length
}
