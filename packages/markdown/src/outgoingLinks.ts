import { wikilinkTarget } from './wikilinkText'

/** Extract all outgoing wikilink targets from content. */
export function extractOutgoingLinks(content: string): string[] {
  const links: string[] = []
  const re = /\[\[([^\]]+)\]\]/g
  let match

  while ((match = re.exec(content)) !== null) {
    const target = wikilinkTarget({ inner: match[1] })
    if (target) {
      links.push(target)
    }
  }

  return [...new Set(links)].sort()
}
