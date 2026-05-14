import { describe, expect, it } from 'vitest'
import { filterMobilePropertyComboOptions, resolveMobilePropertyComboValue } from './mobilePropertyCombo'

describe('mobile property combo', () => {
  const options = ['Note', 'Essay', 'Project', 'Evergreen']

  it('filters options from typed text', () => {
    expect(filterMobilePropertyComboOptions({ options, query: 'ess' })).toEqual(['Essay'])
    expect(filterMobilePropertyComboOptions({ options, query: 'e' })).toEqual(['Note', 'Essay', 'Project', 'Evergreen'])
  })

  it('normalizes exact typed selections to the canonical option label', () => {
    expect(resolveMobilePropertyComboValue({ options, value: ' essay ' })).toBe('Essay')
    expect(resolveMobilePropertyComboValue({ options, value: 'Custom' })).toBe('Custom')
  })
})
