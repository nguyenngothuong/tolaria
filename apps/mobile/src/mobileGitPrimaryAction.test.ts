import { describe, expect, it } from 'vitest'
import { mobileGitPrimaryActionForPlan } from './mobileGitPrimaryAction'
import type { MobileGitRemote } from './mobileGitRemote'

describe('mobile git primary action', () => {
  it('routes missing credentials to authentication', () => {
    expect(mobileGitPrimaryActionForPlan({
      authStrategy: 'githubOAuth',
      host: 'github.com',
      primaryAction: 'authenticate',
      state: 'authRequired',
    })).toEqual({ state: 'authenticate' })
  })

  it('routes ready pull and push states to transport execution', () => {
    expect(mobileGitPrimaryActionForPlan({
      canPull: true,
      canPush: false,
      primaryAction: 'pull',
      remote: remote(),
      state: 'ready',
    })).toMatchObject({ operation: 'pull', state: 'transport' })

    expect(mobileGitPrimaryActionForPlan({
      canPull: true,
      canPush: true,
      primaryAction: 'push',
      remote: remote(),
      state: 'ready',
    })).toMatchObject({ operation: 'push', state: 'transport' })
  })

  it('retries clone failures through authentication and sync failures through transport', () => {
    expect(mobileGitPrimaryActionForPlan({
      message: 'GitHub authentication failed.',
      operation: 'clone',
      primaryAction: 'retry',
      remote: remote(),
      state: 'failed',
    })).toEqual({ state: 'authenticate' })

    expect(mobileGitPrimaryActionForPlan({
      message: 'Pull failed.',
      operation: 'pull',
      primaryAction: 'retry',
      remote: remote(),
      state: 'failed',
    })).toMatchObject({ operation: 'pull', state: 'transport' })
  })

  it('ignores local-only and already syncing plans', () => {
    expect(mobileGitPrimaryActionForPlan({ primaryAction: null, state: 'localOnly' })).toEqual({ state: 'ignored' })
    expect(mobileGitPrimaryActionForPlan({
      operation: 'pull',
      primaryAction: null,
      remote: remote(),
      state: 'syncing',
    })).toEqual({ state: 'ignored' })
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
