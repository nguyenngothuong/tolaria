import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import { loadMobileGitCredentialStateForVault } from './mobileGitCredentialStateForVault'
import type { MobileGitCredentialState, MobileGitOperation } from './mobileGitSyncPlan'
import { createMobileGitSyncPlanForVault } from './mobileGitSyncRuntimePlan'
import { runMobileGitSyncFlowAction, type MobileGitSyncFlowFailure } from './mobileGitSyncFlowAction'
import type { MobileGitTransport } from './mobileGitTransport'
import type { MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'
import type { MobileVaultMetadata } from './mobileVaultMetadata'
import { createMobileVaultConfig } from './mobileVaultConfig'

export function useMobileGitSyncFlow({
  createGitHubOAuthSession,
  credentialStorage,
  gitTransport,
  onSynced,
  vault,
}: {
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  credentialStorage: MobileGitCredentialStorage
  gitTransport: MobileGitTransport
  onSynced?: () => void
  vault: MobileVaultMetadata
}) {
  const [failure, setFailure] = useState<MobileGitSyncFlowFailure | null>(null)
  const [activeOperation, setActiveOperation] = useState<MobileGitOperation | null>(null)
  const { credentials, refreshCredentials } = useMobileGitCredentials({ credentialStorage, vault })
  const repositoryStatus = useMobileGitRepositoryStatus({ gitTransport, vault })
  const gitSyncPlan = useMemo(
    () => createMobileGitSyncPlanForVault({
      credentials,
      ...(failure ? { failure } : {}),
      hasLocalChanges: repositoryStatus.hasLocalChanges,
      ...(activeOperation ? { operation: activeOperation } : {}),
      vault,
    }),
    [activeOperation, credentials, failure, repositoryStatus.hasLocalChanges, vault],
  )
  const runPrimaryAction = useMobileGitPrimaryAction({
    activeOperation,
    createGitHubOAuthSession,
    credentialStorage,
    gitSyncPlan,
    gitTransport,
    onSynced,
    refreshCredentials,
    repositoryStatus,
    setActiveOperation,
    setFailure,
    vault,
  })

  useEffect(refreshCredentials, [refreshCredentials])
  useEffect(repositoryStatus.refresh, [repositoryStatus.refresh])

  return {
    gitSyncPlan,
    markLocalChanges: repositoryStatus.markLocalChanges,
    refreshRepositoryStatus: repositoryStatus.refresh,
    runPrimaryAction,
  }
}

function useMobileGitCredentials({
  credentialStorage,
  vault,
}: {
  credentialStorage: MobileGitCredentialStorage
  vault: MobileVaultMetadata
}) {
  const [credentials, setCredentials] = useState<MobileGitCredentialState>({ state: 'missing' })
  const refreshCredentials = useCallback(() => {
    void loadMobileGitCredentialStateForVault({ credentialStorage, vault })
      .then(setCredentials)
      .catch(() => setCredentials({ state: 'missing' }))
  }, [credentialStorage, vault])

  return { credentials, refreshCredentials }
}

function useMobileGitRepositoryStatus({
  gitTransport,
  vault,
}: {
  gitTransport: MobileGitTransport
  vault: MobileVaultMetadata
}) {
  const [hasLocalChanges, setHasLocalChanges] = useState(false)
  const refresh = useCallback(() => {
    const remote = mobileGitRemoteForVault(vault)
    if (!gitTransport.status || !remote) {
      setHasLocalChanges(false)
      return
    }

    void gitTransport.status({ remote, vault })
      .then((status) => setHasLocalChanges(status.state === 'available' && status.hasLocalChanges))
      .catch(() => setHasLocalChanges(false))
  }, [gitTransport, vault])
  const markLocalChanges = useCallback(() => setHasLocalChanges(true), [])

  return { hasLocalChanges, markLocalChanges, refresh, setHasLocalChanges }
}

function useMobileGitPrimaryAction({
  activeOperation,
  createGitHubOAuthSession,
  credentialStorage,
  gitSyncPlan,
  gitTransport,
  onSynced,
  refreshCredentials,
  repositoryStatus,
  setActiveOperation,
  setFailure,
  vault,
}: {
  activeOperation: MobileGitOperation | null
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  credentialStorage: MobileGitCredentialStorage
  gitSyncPlan: ReturnType<typeof createMobileGitSyncPlanForVault>
  gitTransport: MobileGitTransport
  onSynced?: () => void
  refreshCredentials: () => void
  repositoryStatus: ReturnType<typeof useMobileGitRepositoryStatus>
  setActiveOperation: (operation: MobileGitOperation | null) => void
  setFailure: (failure: MobileGitSyncFlowFailure | null) => void
  vault: MobileVaultMetadata
}) {
  return useCallback(() => {
    runMobileGitSyncFlowAction({
      activeOperation,
      credentialStorage,
      createGitHubOAuthSession,
      gitSyncPlan,
      gitTransport,
      onSynced: () => {
        repositoryStatus.setHasLocalChanges(false)
        repositoryStatus.refresh()
        onSynced?.()
      },
      refreshCredentials,
      setActiveOperation,
      setFailure,
      vault,
    })
  }, [
    activeOperation,
    createGitHubOAuthSession,
    credentialStorage,
    gitSyncPlan,
    gitTransport,
    onSynced,
    refreshCredentials,
    repositoryStatus,
    setActiveOperation,
    setFailure,
    vault,
  ])
}

function mobileGitRemoteForVault(vault: MobileVaultMetadata) {
  const result = createMobileVaultConfig(vault)
  return result.ok && result.config.sync.state === 'remoteReady'
    ? result.config.sync.remote
    : null
}
