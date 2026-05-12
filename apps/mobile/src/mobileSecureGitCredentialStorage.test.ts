import { describe, expect, it } from 'vitest'
import { createMobileGitCredentialRecord } from './mobileGitCredentialStorage'
import { createMobileSecureGitCredentialStorage, type MobileSecureStore } from './mobileSecureGitCredentialStorage'
import type { MobileVaultAuthRequirement } from './mobileVaultConfig'

describe('createMobileSecureGitCredentialStorage', () => {
  it('saves, loads, and removes credential state through secure storage', async () => {
    const secureStore = createMemorySecureStore()
    const storage = createMobileSecureGitCredentialStorage(secureStore)
    const requirement = githubRequirement('github.com')

    await expect(storage.loadState(requirement)).resolves.toEqual({ state: 'missing' })

    await storage.saveRecord(createMobileGitCredentialRecord({
      requirement,
      storedAt: '2026-05-05T11:00:00.000Z',
    }))

    await expect(storage.loadState(requirement)).resolves.toEqual({ state: 'available' })
    await expect(storage.loadRecord(requirement)).resolves.toMatchObject({
      host: 'github.com',
      kind: 'githubOAuthToken',
    })

    await storage.remove(requirement)

    await expect(storage.loadState(requirement)).resolves.toEqual({ state: 'missing' })
    await expect(storage.loadRecord(requirement)).resolves.toBeNull()
  })

  it('treats malformed secure-store content as missing credentials', async () => {
    const secureStore = createMemorySecureStore()
    const storage = createMobileSecureGitCredentialStorage(secureStore)
    const requirement = githubRequirement('github.com')

    await secureStore.setItemAsync('tolaria:git-credential:githubOAuth:github.com', '{')

    await expect(storage.loadState(requirement)).resolves.toEqual({ state: 'missing' })
  })
})

function createMemorySecureStore(): MobileSecureStore {
  const values = new Map<string, string>()

  return {
    deleteItemAsync: async (key) => {
      values.delete(key)
    },
    getItemAsync: async (key) => values.get(key) ?? null,
    setItemAsync: async (key, value) => {
      values.set(key, value)
    },
  }
}

function githubRequirement(host: string): MobileVaultAuthRequirement {
  return { host, strategy: 'githubOAuth' }
}
