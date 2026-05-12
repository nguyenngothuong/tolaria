import { describe, expect, it } from 'vitest'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import { authenticateMobileGitSyncPlan } from './mobileGitAuthentication'

describe('authenticateMobileGitSyncPlan', () => {
  it('ignores plans that do not need authentication', async () => {
    await expect(authenticateMobileGitSyncPlan({
      credentialStorage: noopCredentialStorage(),
      createGitHubOAuthSession: failingSession,
      now: () => '2026-05-05T12:00:00.000Z',
      plan: { primaryAction: null, state: 'localOnly' },
    })).resolves.toEqual({ state: 'ignored' })
  })

  it('connects GitHub auth-required plans through the OAuth session', async () => {
    const credentialStorage = memoryCredentialStorage()

    await expect(authenticateMobileGitSyncPlan({
      credentialStorage,
      createGitHubOAuthSession: () => ({
        authorize: async () => ({
          state: 'succeeded',
          token: { accessToken: 'token', tokenType: 'bearer' },
        }),
      }),
      now: () => '2026-05-05T12:00:00.000Z',
      plan: {
        authStrategy: 'githubOAuth',
        host: 'github.com',
        primaryAction: 'authenticate',
        state: 'authRequired',
      },
    })).resolves.toEqual({ state: 'connected' })

    await expect(credentialStorage.loadState({ host: 'github.com', strategy: 'githubOAuth' }))
      .resolves.toEqual({ state: 'available' })
  })

  it('fails unsupported SSH authentication without starting OAuth', async () => {
    await expect(authenticateMobileGitSyncPlan({
      credentialStorage: noopCredentialStorage(),
      createGitHubOAuthSession: failingSession,
      now: () => '2026-05-05T12:00:00.000Z',
      plan: {
        authStrategy: 'sshKey',
        host: 'git.example.com',
        primaryAction: 'authenticate',
        state: 'authRequired',
      },
    })).resolves.toEqual({
      message: 'SSH credential setup is not available yet.',
      state: 'failed',
    })
  })
})

function memoryCredentialStorage(): MobileGitCredentialStorage {
  let isAvailable = false

  return {
    loadRecord: async () => null,
    loadState: async () => isAvailable ? { state: 'available' } : { state: 'missing' },
    remove: async () => {
      isAvailable = false
    },
    saveRecord: async () => {
      isAvailable = true
    },
  }
}

function noopCredentialStorage(): MobileGitCredentialStorage {
  return {
    loadRecord: async () => null,
    loadState: async () => ({ state: 'missing' }),
    remove: async () => {},
    saveRecord: async () => {},
  }
}

function failingSession() {
  return {
    authorize: async () => {
      throw new Error('should not start OAuth')
    },
  }
}
