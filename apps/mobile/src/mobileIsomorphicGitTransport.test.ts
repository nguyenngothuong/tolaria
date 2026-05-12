import { describe, expect, it } from 'vitest'
import type { StatusRow } from 'isomorphic-git'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import type { ExpoMobileVaultFileSystem } from './mobileExpoVaultStorage'
import {
  createIsomorphicMobileGitTransport,
  type MobileIsoGitClient,
} from './mobileIsomorphicGitTransport'
import type { MobileGitTransportRequest } from './mobileGitTransport'

describe('isomorphic mobile git transport', () => {
  it('clones a remote vault when the app-local directory is not a git repository', async () => {
    const { events, transport } = transportFixture({ hasRepository: false })

    await expect(transport.pull(request())).resolves.toEqual({ state: 'completed' })

    expect(events).toEqual(['clone:https://github.com/refactoringhq/tolaria.git'])
  })

  it('pulls an existing app-local repository', async () => {
    const { events, transport } = transportFixture({ hasRepository: true })

    await expect(transport.pull(request())).resolves.toEqual({ state: 'completed' })

    expect(events).toEqual(['pull'])
  })

  it('autocommits changed and deleted files before pushing', async () => {
    const events: string[] = []
    const transport = createIsomorphicMobileGitTransport({
      credentialStorage: credentialStorage(),
      fileSystem: fileSystem({ hasRepository: true }),
      gitClient: gitClient({
        events,
        statusRows: [
          ['changed.md', 1, 2, 1],
          ['deleted.md', 1, 0, 1],
        ],
      }),
    })

    await expect(transport.push(request())).resolves.toEqual({ state: 'completed' })

    expect(events).toEqual(['add:changed.md', 'remove:deleted.md', 'commit', 'push'])
  })

  it('reports dirty repository state for sync planning', async () => {
    const transport = createIsomorphicMobileGitTransport({
      credentialStorage: credentialStorage(),
      fileSystem: fileSystem({ hasRepository: true }),
      gitClient: gitClient({ statusRows: [['changed.md', 1, 2, 1]] }),
    })

    await expect(transport.status?.(request())).resolves.toEqual({
      hasLocalChanges: true,
      isRepository: true,
      state: 'available',
    })
  })
})

function transportFixture({
  hasRepository,
  statusRows,
}: {
  hasRepository: boolean
  statusRows?: StatusRow[]
}) {
  const events: string[] = []
  const transport = createIsomorphicMobileGitTransport({
    credentialStorage: credentialStorage(),
    fileSystem: fileSystem({ hasRepository }),
    gitClient: gitClient({ events, statusRows }),
  })

  return { events, transport }
}

function gitClient({
  events = [],
  statusRows = [],
}: {
  events?: string[]
  statusRows?: StatusRow[]
} = {}): MobileIsoGitClient {
  return {
    add: async ({ filepath }) => {
      events.push(`add:${filepath}`)
    },
    clone: async ({ url }) => {
      events.push(`clone:${url}`)
    },
    commit: async () => {
      events.push('commit')
      return 'commit-oid'
    },
    pull: async () => {
      events.push('pull')
    },
    push: async () => {
      events.push('push')
      return { error: null, ok: true }
    },
    remove: async ({ filepath }) => {
      events.push(`remove:${filepath}`)
    },
    statusMatrix: async () => statusRows,
  }
}

function credentialStorage(): MobileGitCredentialStorage {
  return {
    loadRecord: async () => ({
      host: 'github.com',
      kind: 'githubOAuthToken',
      secret: {
        accessToken: 'github-token',
        tokenType: 'bearer',
      },
      strategy: 'githubOAuth',
      storedAt: '2026-05-12T12:00:00.000Z',
    }),
    loadState: async () => ({ state: 'available' }),
    remove: async () => {},
    saveRecord: async () => {},
  }
}

function fileSystem({ hasRepository }: { hasRepository: boolean }): ExpoMobileVaultFileSystem {
  return {
    deleteAsync: async () => {},
    documentDirectory: 'file:///docs/',
    getInfoAsync: async (uri) => ({
      exists: uri === 'file:///docs/vaults/personal-journal' || (hasRepository && uri.endsWith('/.git')),
      isDirectory: true,
      modificationTime: 0,
      size: 0,
    }),
    makeDirectoryAsync: async () => {},
    readAsStringAsync: async () => '',
    readDirectoryAsync: async () => [],
    writeAsStringAsync: async () => {},
  }
}

function request(): MobileGitTransportRequest {
  return {
    remote: {
      authStrategy: 'githubOAuth',
      host: 'github.com',
      owner: 'refactoringhq',
      repository: 'tolaria',
      url: 'https://github.com/refactoringhq/tolaria.git',
    },
    vault: {
      id: 'personal',
      name: 'Personal Journal',
      remoteUrl: 'https://github.com/refactoringhq/tolaria.git',
    },
  }
}
