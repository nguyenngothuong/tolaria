import {
  createMobileGitSyncPlan,
  type MobileGitCredentialState,
  type MobileGitOperation,
  type MobileGitSyncPlan,
} from './mobileGitSyncPlan'
import { createMobileVaultConfig } from './mobileVaultConfig'
import type { MobileVaultMetadata } from './mobileVaultMetadata'

export function createMobileGitSyncPlanForVault({
  credentials = { state: 'missing' },
  failure,
  hasLocalChanges = false,
  operation,
  vault,
}: {
  credentials?: MobileGitCredentialState
  failure?: { message: string; operation: MobileGitOperation }
  hasLocalChanges?: boolean
  operation?: MobileGitOperation
  vault: MobileVaultMetadata
}): MobileGitSyncPlan {
  const result = createMobileVaultConfig(vault)
  if (!result.ok) {
    return { primaryAction: null, state: 'localOnly' }
  }

  return createMobileGitSyncPlan({
    credentials,
    failure,
    hasLocalChanges,
    operation,
    sync: result.config.sync,
  })
}
