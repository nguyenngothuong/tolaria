import { useCallback, useEffect, useMemo, useState } from 'react'
import type { MobileGitCredentialStorage } from './mobileGitCredentialStorage'
import { loadMobileGitCredentialStateForVault } from './mobileGitCredentialStateForVault'
import type { MobileGitCredentialState, MobileGitOperation } from './mobileGitSyncPlan'
import { createMobileGitSyncPlanForVault } from './mobileGitSyncRuntimePlan'
import { runMobileGitSyncFlowAction, type MobileGitSyncFlowFailure } from './mobileGitSyncFlowAction'
import type { MobileGitTransport } from './mobileGitTransport'
import type { MobileGitHubOAuthSession } from './mobileGitHubOAuthFlow'
import type { MobileVaultMetadata } from './mobileVaultMetadata'

export function useMobileGitSyncFlow({
  createGitHubOAuthSession,
  credentialStorage,
  gitTransport,
  vault,
}: {
  createGitHubOAuthSession: () => MobileGitHubOAuthSession
  credentialStorage: MobileGitCredentialStorage
  gitTransport: MobileGitTransport
  vault: MobileVaultMetadata
}) {
  const [failure, setFailure] = useState<MobileGitSyncFlowFailure | null>(null)
  const [credentials, setCredentials] = useState<MobileGitCredentialState>({ state: 'missing' })
  const [activeOperation, setActiveOperation] = useState<MobileGitOperation | null>(null)
  const refreshCredentials = useCallback(() => {
    void loadMobileGitCredentialStateForVault({ credentialStorage, vault })
      .then(setCredentials)
      .catch(() => setCredentials({ state: 'missing' }))
  }, [credentialStorage, vault])
  const gitSyncPlan = useMemo(
    () => createMobileGitSyncPlanForVault({
      credentials,
      ...(failure ? { failure } : {}),
      ...(activeOperation ? { operation: activeOperation } : {}),
      vault,
    }),
    [activeOperation, credentials, failure, vault],
  )
  const runPrimaryAction = useCallback(() => {
    runMobileGitSyncFlowAction({
      activeOperation,
      credentialStorage,
      createGitHubOAuthSession,
      gitSyncPlan,
      gitTransport,
      refreshCredentials,
      setActiveOperation,
      setFailure,
      vault,
    })
  }, [activeOperation, createGitHubOAuthSession, credentialStorage, gitSyncPlan, gitTransport, refreshCredentials, vault])

  useEffect(refreshCredentials, [refreshCredentials])

  return {
    gitSyncPlan,
    runPrimaryAction,
  }
}
