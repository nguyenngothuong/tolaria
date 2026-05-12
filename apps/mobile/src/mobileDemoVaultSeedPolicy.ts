import type { MobileVaultMetadata } from './mobileVaultMetadata'

export function shouldSeedDemoVault(vaultMetadata: MobileVaultMetadata) {
  return !vaultMetadata.remoteUrl?.trim()
}
