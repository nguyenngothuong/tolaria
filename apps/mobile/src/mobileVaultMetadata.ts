import { createMobileVaultConfig } from './mobileVaultConfig'

export type MobileVaultMetadata = {
  id: string
  name: string
  remoteUrl?: string
}

export const defaultMobileVaultMetadata: MobileVaultMetadata = {
  id: 'personal',
  name: 'Personal Journal',
}

export function createMobileVaultConfigFromMetadata(metadata: MobileVaultMetadata) {
  const result = createMobileVaultConfig(metadata)
  if (!result.ok) {
    throw new Error(result.error)
  }

  return result.config
}

export function selectActiveMobileVaultMetadata({
  activeVaultId,
  vaults,
}: {
  activeVaultId: string
  vaults: MobileVaultMetadata[]
}) {
  return vaults.find((vault) => vault.id === activeVaultId) ?? vaults[0] ?? defaultMobileVaultMetadata
}
