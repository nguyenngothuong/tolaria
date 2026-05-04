import { describe, expect, it } from 'vitest'
import {
  createMobileVaultConfigFromMetadata,
  defaultMobileVaultMetadata,
  selectActiveMobileVaultMetadata,
} from './mobileVaultMetadata'

describe('mobile vault metadata', () => {
  it('creates mobile vault config from persisted metadata', () => {
    const config = createMobileVaultConfigFromMetadata({
      id: 'work',
      name: 'Work Vault',
      remoteUrl: 'https://github.com/refactoringhq/tolaria-work.git',
    })

    expect(config.id).toBe('work')
    expect(config.name).toBe('Work Vault')
    expect(config.storage.directoryName).toBe('work-vault')
    expect(config.sync.state).toBe('remoteReady')
  })

  it('selects the active vault metadata when available', () => {
    expect(selectActiveMobileVaultMetadata({
      activeVaultId: 'work',
      vaults: [
        defaultMobileVaultMetadata,
        { id: 'work', name: 'Work Vault' },
      ],
    })).toEqual({ id: 'work', name: 'Work Vault' })
  })

  it('falls back to the default vault metadata when no vaults exist', () => {
    expect(selectActiveMobileVaultMetadata({
      activeVaultId: 'missing',
      vaults: [],
    })).toEqual(defaultMobileVaultMetadata)
  })
})
