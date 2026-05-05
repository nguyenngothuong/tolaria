import { describe, expect, it } from 'vitest'
import {
  createUnavailableMobileGitTransport,
  runMobileGitTransportOperation,
  type MobileGitTransport,
} from './mobileGitTransport'
import type { MobileGitRemote } from './mobileGitRemote'

describe('mobile git transport', () => {
  it('runs the requested transport operation', async () => {
    const calls: string[] = []
    const transport: MobileGitTransport = {
      pull: async () => {
        calls.push('pull')
        return { state: 'completed' }
      },
      push: async () => {
        calls.push('push')
        return { state: 'completed' }
      },
    }

    await runMobileGitTransportOperation({
      operation: 'push',
      remote: remote(),
      transport,
      vault: { id: 'personal', name: 'Personal Journal' },
    })

    expect(calls).toEqual(['push'])
  })

  it('fails explicitly until a native git implementation is wired', async () => {
    await expect(createUnavailableMobileGitTransport().pull({
      remote: remote(),
      vault: { id: 'personal', name: 'Personal Journal' },
    })).resolves.toEqual({
      message: 'Mobile Git transport is not available yet.',
      state: 'failed',
    })
  })
})

function remote(): MobileGitRemote {
  return {
    authStrategy: 'githubOAuth',
    host: 'github.com',
    owner: 'refactoringhq',
    repository: 'tolaria',
    url: 'https://github.com/refactoringhq/tolaria.git',
  }
}
