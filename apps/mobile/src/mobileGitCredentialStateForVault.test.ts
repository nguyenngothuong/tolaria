import { describe, expect, it } from 'vitest'
import {
  createMobileGitCredentialRecord,
  type MobileGitCredentialStorage,
} from './mobileGitCredentialStorage'
import { loadMobileGitCredentialStateForVault } from './mobileGitCredentialStateForVault'

describe('loadMobileGitCredentialStateForVault', () => {
  it('keeps local-only vaults credential-missing without hitting secure storage', async () => {
    await expect(loadMobileGitCredentialStateForVault({
      credentialStorage: failingCredentialStorage(),
      vault: { id: 'personal', name: 'Personal Journal' },
    })).resolves.toEqual({ state: 'missing' })
  })

  it('loads credential state for a remote-backed vault auth requirement', async () => {
    const credentialStorage = memoryCredentialStorage()
    await credentialStorage.saveRecord(createMobileGitCredentialRecord({
      requirement: { host: 'github.com', strategy: 'githubOAuth' },
      storedAt: '2026-05-05T12:00:00.000Z',
    }))

    await expect(loadMobileGitCredentialStateForVault({
      credentialStorage,
      vault: {
        id: 'tolaria',
        name: 'Tolaria',
        remoteUrl: 'https://github.com/refactoringhq/tolaria.git',
      },
    })).resolves.toEqual({ state: 'available' })
  })
})

function memoryCredentialStorage(): MobileGitCredentialStorage {
  const records = new Map<string, ReturnType<typeof createMobileGitCredentialRecord>>()

  return {
    loadRecord: async (requirement) => records.get(`${requirement.strategy}:${requirement.host}`) ?? null,
    loadState: async (requirement) => records.has(`${requirement.strategy}:${requirement.host}`)
      ? { state: 'available' }
      : { state: 'missing' },
    remove: async (requirement) => {
      records.delete(`${requirement.strategy}:${requirement.host}`)
    },
    saveRecord: async (record) => {
      records.set(`${record.strategy}:${record.host}`, record)
    },
  }
}

function failingCredentialStorage(): MobileGitCredentialStorage {
  return {
    loadRecord: async () => {
      throw new Error('should not load credentials')
    },
    loadState: async () => {
      throw new Error('should not load credentials')
    },
    remove: async () => {},
    saveRecord: async () => {},
  }
}
