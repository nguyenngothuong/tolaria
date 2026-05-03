export interface WikilinkInnerText {
  inner: string
}

export function wikilinkTarget({ inner }: WikilinkInnerText): string {
  const pipeIndex = inner.indexOf('|')
  return pipeIndex === -1 ? inner : inner.slice(0, pipeIndex)
}

export function wikilinkDisplayText({ inner }: WikilinkInnerText): string {
  const pipeIndex = inner.indexOf('|')
  return pipeIndex === -1 ? inner : inner.slice(pipeIndex + 1)
}
