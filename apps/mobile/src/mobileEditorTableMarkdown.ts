type HtmlInput = {
  html: string
}

type TableRow = {
  cells: string[]
}

export function isMobileEditorTableBlock(input: HtmlInput) {
  return input.html.match(/^<table/i)
}

export function canSerializeMobileEditorTable(input: HtmlInput) {
  const rows = tableRows(input)
  const columnCount = rows[0]?.cells.length ?? 0

  return columnCount > 0 && rows.every((row) => row.cells.length === columnCount)
}

export function mobileEditorTableMarkdown(input: HtmlInput) {
  const rows = tableRows(input)
  const header = rows[0]?.cells ?? []
  const body = rows.slice(1).map(tableRowMarkdown)

  return [
    tableRowMarkdown({ cells: header }),
    tableSeparator({ columnCount: header.length }),
    ...body,
  ].join('\n')
}

function tableRows(input: HtmlInput) {
  return [...input.html.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)]
    .map((match) => tableRow({ html: match[1] }))
}

function tableRow(input: HtmlInput): TableRow {
  return {
    cells: [...input.html.matchAll(/<t[hd](?:\s[^>]*)?>([\s\S]*?)<\/t[hd]>/gi)]
      .map((match) => tableCellMarkdown({ html: match[1] })),
  }
}

function tableCellMarkdown(input: HtmlInput) {
  return decodeHtmlEntities({ text: stripCellTags(input).trim() })
    .replace(/\s+/g, ' ')
    .replace(/\|/g, '\\|')
}

function tableRowMarkdown(input: TableRow) {
  return `| ${input.cells.join(' | ')} |`
}

function tableSeparator(input: { columnCount: number }) {
  return tableRowMarkdown({ cells: Array.from({ length: input.columnCount }, () => '---') })
}

function stripCellTags(input: HtmlInput) {
  return input.html.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
}

function decodeHtmlEntities(input: { text: string }) {
  return input.text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
}
