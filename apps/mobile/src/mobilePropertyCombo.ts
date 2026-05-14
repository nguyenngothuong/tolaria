export function filterMobilePropertyComboOptions({
  options,
  query,
}: {
  options: readonly string[]
  query: string
}) {
  const normalizedQuery = normalizeComboText(query)
  if (!normalizedQuery) {
    return options
  }

  return options.filter((option) => normalizeComboText(option).includes(normalizedQuery))
}

export function resolveMobilePropertyComboValue({
  options,
  value,
}: {
  options: readonly string[]
  value: string
}) {
  const trimmed = value.trim()
  const exactOption = options.find((option) => normalizeComboText(option) === normalizeComboText(trimmed))
  return exactOption ?? trimmed
}

function normalizeComboText(value: string) {
  return value.trim().toLowerCase()
}
