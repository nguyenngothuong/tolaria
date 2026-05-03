/** Strip YAML frontmatter from markdown, returning [frontmatter, body]. */
export function splitFrontmatter(content: string): [string, string] {
  if (!content.startsWith('---')) return ['', content]

  const end = content.indexOf('\n---', 3)
  if (end === -1) return ['', content]

  let bodyStart = end + 4
  if (content[bodyStart] === '\n') {
    bodyStart++
  }

  return [content.slice(0, bodyStart), content.slice(bodyStart)]
}
