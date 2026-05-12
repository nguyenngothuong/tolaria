import * as ExpoFileSystem from 'expo-file-system/legacy'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import { createIsomorphicMobileGitTransport } from './mobileIsomorphicGitTransport'

export function createNativeIsomorphicMobileGitTransport(credentialStorage: MobileGitCredentialStorage) {
  return createIsomorphicMobileGitTransport({
    credentialStorage,
    fileSystem: ExpoFileSystem,
  })
}
