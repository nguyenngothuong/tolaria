import { describe, expect, it } from 'vitest'
import {
  defaultTabletPanelWidths,
  nextLeftPanelToReveal,
  snappedTabletPanelWidth,
  tabletPanelWidthDuringDrag,
} from './tabletPanelLayout'

describe('tablet panel layout', () => {
  it('resizes left panels with the drag translation', () => {
    expect(tabletPanelWidthDuringDrag({
      panel: 'sidebar',
      startWidth: defaultTabletPanelWidths.sidebar,
      translationX: -100,
    })).toBe(defaultTabletPanelWidths.sidebar - 100)

    expect(tabletPanelWidthDuringDrag({
      panel: 'list',
      startWidth: 0,
      translationX: 180,
    })).toBe(180)
  })

  it('resizes the right panel in the opposite direction', () => {
    expect(tabletPanelWidthDuringDrag({
      panel: 'right',
      startWidth: defaultTabletPanelWidths.right,
      translationX: 120,
    })).toBe(defaultTabletPanelWidths.right - 120)

    expect(tabletPanelWidthDuringDrag({
      panel: 'right',
      startWidth: 0,
      translationX: -140,
    })).toBe(140)
  })

  it('snaps panels open or closed using width and velocity', () => {
    expect(snappedTabletPanelWidth({ panel: 'sidebar', velocityX: 0, width: 80 })).toBe(0)
    expect(snappedTabletPanelWidth({ panel: 'sidebar', velocityX: 0, width: 160 })).toBe(defaultTabletPanelWidths.sidebar)
    expect(snappedTabletPanelWidth({ panel: 'right', velocityX: -500, width: 20 })).toBe(defaultTabletPanelWidths.right)
    expect(snappedTabletPanelWidth({ panel: 'list', velocityX: -500, width: 300 })).toBe(0)
  })

  it('reveals the note list before the sidebar from the left edge', () => {
    expect(nextLeftPanelToReveal({ ...defaultTabletPanelWidths, list: 0, sidebar: 0 })).toBe('list')
    expect(nextLeftPanelToReveal({ ...defaultTabletPanelWidths, sidebar: 0 })).toBe('sidebar')
    expect(nextLeftPanelToReveal(defaultTabletPanelWidths)).toBeNull()
  })
})
