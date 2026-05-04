type EditorHtmlInput = {
  editorHtml: string
}

type HtmlInput = {
  html: string
}

type ListItemInput = HtmlInput & {
  ordered: boolean
}

export function serializeSupportedMobileEditorHtml(input: EditorHtmlInput) {
  const html = normalizeBlockSpacing(input)
  const blocks = html.match(/<(h[1-6]|p|ul|ol)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi)
  if (!blocks || blocks.join('') !== html) {
    return null
  }

  return blocks.map((block) => serializeBlock({ html: block })).join('\n\n')
}

function serializeBlock(input: HtmlInput) {
  const headingLevel = headingMarkdownLevel(input)
  if (headingLevel) {
    return `${'#'.repeat(headingLevel)} ${inlineMarkdown(input)}`
  }

  if (isListBlock(input)) {
    return listItemMarkdown(input).join('\n')
  }

  return inlineMarkdown(input)
}

function normalizeBlockSpacing(input: EditorHtmlInput) {
  return input.editorHtml.trim().replace(/>\s+</g, '><')
}

function headingMarkdownLevel(input: HtmlInput) {
  const match = input.html.match(/^<h([1-6])/i)
  return match ? Number(match[1]) : null
}

function isListBlock(input: HtmlInput) {
  return input.html.match(/^<(ul|ol)/i)
}

function listItemMarkdown(input: HtmlInput) {
  const ordered = input.html.match(/^<ol/i)
  return [...input.html.matchAll(/<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi)].map((match) =>
    formatListItem({ ordered: Boolean(ordered), html: match[0] }),
  )
}

function formatListItem(input: ListItemInput) {
  const taskMarker = markdownTaskMarker(input)
  const prefix = taskMarker ? `- ${taskMarker}` : input.ordered ? '1.' : '-'

  return `${prefix} ${inlineMarkdown(input)}`
}

function markdownTaskMarker(input: HtmlInput) {
  if (input.html.match(/data-checked=["']true/i) || input.html.match(/<input[^>]+checked/i)) {
    return '[x]'
  }

  if (input.html.match(/data-checked=["']false/i) || input.html.match(/<input[^>]+type=["']checkbox/i)) {
    return '[ ]'
  }

  return null
}

function inlineMarkdown(input: HtmlInput) {
  return decodeHtmlEntities({ text: stripRemainingTags(markInlineHtml(input)).trim() })
}

function markInlineHtml(input: HtmlInput) {
  return input.html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(strong|b)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '*$2*')
    .replace(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<a(?:\s[^>]*)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
}

function stripRemainingTags(value: string) {
  return value.replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(input: { text: string }) {
  return input.text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}
