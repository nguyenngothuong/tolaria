export type TabletPanelKey = 'list' | 'right' | 'sidebar'

export type TabletPanelWidths = Record<TabletPanelKey, number>

const minPanelWidth = 0
const snapVelocity = 420
const visibleRatio = 0.42

export const defaultTabletPanelWidths: TabletPanelWidths = {
  list: 360,
  right: 300,
  sidebar: 272,
}

export function tabletPanelMaxWidth(panel: TabletPanelKey) {
  return defaultTabletPanelWidths[panel]
}

export function tabletPanelWidthDuringDrag({
  panel,
  startWidth,
  translationX,
}: {
  panel: TabletPanelKey
  startWidth: number
  translationX: number
}) {
  const direction = panel === 'right' ? -1 : 1
  return clampTabletPanelWidth({
    panel,
    width: startWidth + (translationX * direction),
  })
}

export function snappedTabletPanelWidth({
  panel,
  velocityX,
  width,
}: {
  panel: TabletPanelKey
  velocityX: number
  width: number
}) {
  const maxWidth = tabletPanelMaxWidth(panel)
  const velocityDecision = tabletPanelVelocityDecision({ panel, velocityX })
  if (velocityDecision !== null) {
    return velocityDecision === 'open' ? maxWidth : minPanelWidth
  }

  return width >= maxWidth * visibleRatio ? maxWidth : minPanelWidth
}

export function nextLeftPanelToReveal(widths: TabletPanelWidths): TabletPanelKey | null {
  if (widths.list <= minPanelWidth) {
    return 'list'
  }
  if (widths.sidebar <= minPanelWidth) {
    return 'sidebar'
  }

  return null
}

export function isTabletPanelVisible(width: number) {
  return width > minPanelWidth
}

function tabletPanelVelocityDecision({
  panel,
  velocityX,
}: {
  panel: TabletPanelKey
  velocityX: number
}) {
  if (Math.abs(velocityX) < snapVelocity) {
    return null
  }

  return tabletPanelOpeningVelocity({ panel, velocityX }) ? 'open' : 'closed'
}

function tabletPanelOpeningVelocity({
  panel,
  velocityX,
}: {
  panel: TabletPanelKey
  velocityX: number
}) {
  return panel === 'right' ? velocityX < 0 : velocityX > 0
}

function clampTabletPanelWidth({
  panel,
  width,
}: {
  panel: TabletPanelKey
  width: number
}) {
  return Math.min(tabletPanelMaxWidth(panel), Math.max(minPanelWidth, width))
}
