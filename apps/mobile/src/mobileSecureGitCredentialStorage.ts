import {
  createMobileGitCredentialKey,
  mobileGitCredentialState,
  parseMobileGitCredentialRecord,
  serializeMobileGitCredentialRecord,
  type MobileGitCredentialRecord,
  type MobileGitCredentialStorage,
} from './mobileGitCredentialStorage'

export type MobileSecureStore = {
  deleteItemAsync: (key: string) => Promise<void>
  getItemAsync: (key: string) => Promise<string | null>
  setItemAsync: (key: string, value: string) => Promise<void>
}

export function createMobileSecureGitCredentialStorage(
  secureStore: MobileSecureStore,
): MobileGitCredentialStorage {
  return {
    loadRecord: async (requirement) =>
      parseMobileGitCredentialRecord(await secureStore.getItemAsync(createMobileGitCredentialKey(requirement))),
    loadState: async (requirement) => mobileGitCredentialState({
      record: parseMobileGitCredentialRecord(await secureStore.getItemAsync(createMobileGitCredentialKey(requirement))),
      requirement,
    }),
    remove: async (requirement) => {
      await secureStore.deleteItemAsync(createMobileGitCredentialKey(requirement))
    },
    saveRecord: async (record) => {
      await secureStore.setItemAsync(recordKey(record), serializeMobileGitCredentialRecord(record))
    },
  }
}

function recordKey(record: MobileGitCredentialRecord) {
  return createMobileGitCredentialKey({
    host: record.host,
    strategy: record.strategy,
  })
}
