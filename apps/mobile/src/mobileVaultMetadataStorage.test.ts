import { describe, expect, it } from 'vitest'
import {
  createMobileVaultMetadataStorage,
  type MobileVaultMetadataFileSystem,
} from './mobileVaultMetadataStorage'
import { defaultMobileVaultMetadata } from './mobileVaultMetadata'

describe('mobile vault metadata storage', () => {
  it('returns the default vault metadata when no metadata file exists', async () => {
    const storage = createMobileVaultMetadataStorage(createMemoryVaultMetadataFileSystem())

    await expect(storage.load()).resolves.toEqual([defaultMobileVaultMetadata])
  })

  it('persists and restores vault metadata', async () => {
    const fileSystem = createMemoryVaultMetadataFileSystem()
    const storage = createMobileVaultMetadataStorage(fileSystem)

    await storage.save([
      defaultMobileVaultMetadata,
      { id: 'work', name: 'Work Vault', remoteUrl: 'git@github.com:refactoringhq/work.git' },
    ])

    await expect(storage.load()).resolves.toEqual([
      defaultMobileVaultMetadata,
      { id: 'work', name: 'Work Vault', remoteUrl: 'git@github.com:refactoringhq/work.git' },
    ])
  })

  it('ignores corrupt metadata and invalid vault records', async () => {
    const storage = createMobileVaultMetadataStorage(createMemoryVaultMetadataFileSystem({
      'file:///docs/state/vaults.json': JSON.stringify({
        vaults: [
          { id: '', name: 'Broken' },
          { id: 'work', name: 'Work Vault', remoteUrl: '  https://github.com/refactoringhq/work.git  ' },
        ],
      }),
    }))

    await expect(storage.load()).resolves.toEqual([
      { id: 'work', name: 'Work Vault', remoteUrl: 'https://github.com/refactoringhq/work.git' },
    ])
  })
})

function createMemoryVaultMetadataFileSystem(files: Record<string, string> = {}): MobileVaultMetadataFileSystem {
  const fileByUri = new Map(Object.entries(files))
  const directoryUris = new Set(['file:///docs'])

  return {
    documentDirectory: 'file:///docs/',
    getInfoAsync: async (uri) => ({
      exists: fileByUri.has(uri) || directoryUris.has(uri),
      isDirectory: directoryUris.has(uri),
    }),
    makeDirectoryAsync: async (uri) => {
      directoryUris.add(uri)
    },
    readAsStringAsync: async (uri) => fileByUri.get(uri) ?? '',
    writeAsStringAsync: async (uri, content) => {
      fileByUri.set(uri, content)
    },
  }
}
