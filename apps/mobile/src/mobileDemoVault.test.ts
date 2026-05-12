import { describe, expect, it } from 'vitest'
import { shouldSeedDemoVault } from './mobileDemoVaultSeedPolicy'

describe('mobile demo vault loading', () => {
  it('does not seed demo notes into remote-backed vaults', () => {
    expect(shouldSeedDemoVault({
      id: 'personal',
      name: 'Personal Journal',
      remoteUrl: 'https://github.com/refactoringhq/tolaria.git',
    })).toBe(false)
  })

  it('keeps local-only vaults seeded for first-run simulator QA', () => {
    expect(shouldSeedDemoVault({ id: 'personal', name: 'Personal Journal' })).toBe(true)
  })
})
