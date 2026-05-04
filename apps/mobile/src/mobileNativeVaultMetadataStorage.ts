import * as FileSystem from 'expo-file-system/legacy'
import { createMobileVaultMetadataStorage } from './mobileVaultMetadataStorage'

export function createNativeMobileVaultMetadataStorage() {
  return createMobileVaultMetadataStorage(FileSystem)
}
