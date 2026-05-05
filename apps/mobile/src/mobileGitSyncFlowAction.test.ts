import { describe, expect, it } from 'vitest'
import { runMobileGitSyncFlowAction, type MobileGitSyncFlowFailure } from './mobileGitSyncFlowAction'
import type { MobileGitOperation, MobileGitSyncPlan } from './mobileGitSyncPlan'
import type { MobileGitRemote } from './mobileGitRemote'

describe('mobile git sync flow action', () => {
  it('ignores actions while another operation is active', () => {
    const events: string[] = []

    runMobileGitSyncFlowAction({
      ...baseActionInput(events),
      activeOperation: 'pull',
    })

    expect(events).toEqual([])
  })

  it('runs ready pull and records transport failures', async () => {
    const events: string[] = []
    const failures: Array<MobileGitSyncFlowFailure | null> = []

    runMobileGitSyncFlowAction({
      ...baseActionInput(events),
      gitSyncPlan: readyPlan(),
      gitTransport: {
        pull: async () => ({ message: 'Pull failed.', state: 'failed' }),
        push: async () => ({ state: 'completed' }),
      },
      setFailure: (failure) => failures.push(failure),
    })
    await Promise.resolve()

    expect(events).toEqual(['active:pull'])
    expect(failures).toEqual([null, { message: 'Pull failed.', operation: 'pull' }])
  })

  it('routes auth-required plans to the authentication operation', () => {
    const events: string[] = []

    runMobileGitSyncFlowAction({
      ...baseActionInput(events),
      gitSyncPlan: {
        authStrategy: 'githubOAuth',
        host: 'github.com',
        primaryAction: 'authenticate',
        state: 'authRequired',
      },
    })

    expect(events).toEqual(['active:clone'])
  })
})

function baseActionInput(events: string[]) {
  return {
    activeOperation: null,
    credentialStorage: {
      loadState: async () => ({ state: 'missing' as const }),
      remove: async () => {},
      saveRecord: async () => {},
    },
    createGitHubOAuthSession: () => ({
      authorize: async () => ({ state: 'cancelled' as const }),
    }),
    gitSyncPlan: { primaryAction: null, state: 'localOnly' } satisfies MobileGitSyncPlan,
    gitTransport: {
      pull: async () => ({ state: 'completed' as const }),
      push: async () => ({ state: 'completed' as const }),
    },
    refreshCredentials: () => events.push('refresh'),
    setActiveOperation: (operation: MobileGitOperation | null) => {
      if (operation) {
        events.push(`active:${operation}`)
      }
    },
    setFailure: () => {},
    vault: { id: 'personal', name: 'Personal Journal' },
  }
}

function readyPlan(): MobileGitSyncPlan {
  return {
    canPull: true,
    canPush: false,
    primaryAction: 'pull',
    remote: remote(),
    state: 'ready',
  }
}

function remote(): MobileGitRemote {
  return {
    authStrategy: 'githubOAuth',
    host: 'github.com',
    owner: 'refactoringhq',
    repository: 'tolaria',
    url: 'https://github.com/refactoringhq/tolaria.git',
  }
}
