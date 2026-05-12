import { authenticateMobileGitSyncPlan } from './mobileGitAuthentication'
import type { MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'
import { mobileGitPrimaryActionForPlan } from './mobileGitPrimaryAction'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import type { MobileGitOperation, MobileGitSyncPlan } from './mobileGitSyncPlan'
import {
  runMobileGitTransportOperation,
  type MobileGitTransport,
} from './mobileGitTransport'
import type { MobileVaultMetadata } from './mobileVaultMetadata'

export type MobileGitSyncFlowFailure = {
  message: string
  operation: MobileGitOperation
}

export function runMobileGitSyncFlowAction({
  activeOperation,
  credentialStorage,
  createGitHubOAuthSession,
  gitSyncPlan,
  gitTransport,
  onSynced,
  refreshCredentials,
  setActiveOperation,
  setFailure,
  vault,
}: {
  activeOperation: MobileGitOperation | null
  credentialStorage: MobileGitCredentialStorage
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  gitSyncPlan: MobileGitSyncPlan
  gitTransport: MobileGitTransport
  onSynced?: () => void
  refreshCredentials: () => void
  setActiveOperation: (operation: MobileGitOperation | null) => void
  setFailure: (failure: MobileGitSyncFlowFailure | null) => void
  vault: MobileVaultMetadata
}) {
  if (activeOperation) {
    return
  }

  const action = mobileGitPrimaryActionForPlan(gitSyncPlan)
  if (action.state === 'authenticate') {
    runAuthenticationAction({
      credentialStorage,
      createGitHubOAuthSession,
      gitSyncPlan,
      refreshCredentials,
      setActiveOperation,
      setFailure,
    })
    return
  }

  if (action.state === 'transport') {
    runTransportAction({
      gitTransport,
      onSynced,
      operation: action.operation,
      remote: action.remote,
      setActiveOperation,
      setFailure,
      vault,
    })
  }
}

function runAuthenticationAction({
  credentialStorage,
  createGitHubOAuthSession,
  gitSyncPlan,
  refreshCredentials,
  setActiveOperation,
  setFailure,
}: {
  credentialStorage: MobileGitCredentialStorage
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  gitSyncPlan: MobileGitSyncPlan
  refreshCredentials: () => void
  setActiveOperation: (operation: MobileGitOperation | null) => void
  setFailure: (failure: MobileGitSyncFlowFailure | null) => void
}) {
  setFailure(null)
  setActiveOperation('clone')
  void authenticateMobileGitSyncPlan({
    credentialStorage,
    createGitHubOAuthSession,
    now: () => new Date().toISOString(),
    plan: gitSyncPlan,
  })
    .then((result) => {
      if (result.state === 'connected') {
        refreshCredentials()
        return
      }

      if (result.state === 'failed') {
        setFailure({ message: result.message, operation: 'clone' })
      }
    })
    .catch(() => setFailure({ message: 'GitHub authentication failed.', operation: 'clone' }))
    .finally(() => setActiveOperation(null))
}

function runTransportAction({
  gitTransport,
  onSynced,
  operation,
  remote,
  setActiveOperation,
  setFailure,
  vault,
}: {
  gitTransport: MobileGitTransport
  onSynced?: () => void
  operation: 'pull' | 'push'
  remote: Parameters<typeof runMobileGitTransportOperation>[0]['remote']
  setActiveOperation: (operation: MobileGitOperation | null) => void
  setFailure: (failure: MobileGitSyncFlowFailure | null) => void
  vault: MobileVaultMetadata
}) {
  setFailure(null)
  setActiveOperation(operation)
  void runMobileGitTransportOperation({
    operation,
    remote,
    transport: gitTransport,
    vault,
  })
    .then((result) => {
      if (result.state === 'failed') {
        setFailure({ message: result.message, operation })
        return
      }

      onSynced?.()
    })
    .catch(() => setFailure({ message: 'Mobile Git sync failed.', operation }))
    .finally(() => setActiveOperation(null))
}
