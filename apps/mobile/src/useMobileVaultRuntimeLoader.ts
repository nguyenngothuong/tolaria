import { useCallback, useEffect, useState } from 'react'
import type { MobileAppStateStorage } from './mobileAppStateStorage'
import type { MobileNote } from './demoData'
import type { MobileVaultMetadata } from './mobileVaultMetadata'
import type { MobileVaultMetadataStorage } from './mobileVaultMetadataStorage'
import { loadMobileVaultRuntime } from './mobileVaultRuntime'

export function useMobileVaultRuntimeLoader({
  appStateStorage,
  loadNotes,
  metadataStorage,
  onLoaded,
}: {
  appStateStorage: MobileAppStateStorage
  loadNotes: (vault: MobileVaultMetadata) => Promise<MobileNote[]>
  metadataStorage: MobileVaultMetadataStorage
  onLoaded: (runtime: {
    activeVault: MobileVaultMetadata
    notes: MobileNote[]
    selectedNoteId: string | null
  }) => void
}) {
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>('loading')
  const [reloadKey, setReloadKey] = useState(0)

  const retry = useCallback(() => {
    setLoadState('loading')
    setReloadKey((key) => key + 1)
  }, [])

  useEffect(() => {
    let isActive = true

    void loadMobileVaultRuntime({ appStateStorage, loadNotes, metadataStorage })
      .then((runtime) => {
        if (!isActive) {
          return
        }

        if (runtime.notes.length > 0) {
          onLoaded(runtime)
        }
        setLoadState('ready')
      })
      .catch(() => {
        if (isActive) {
          setLoadState('failed')
        }
      })

    return () => {
      isActive = false
    }
  }, [appStateStorage, loadNotes, metadataStorage, onLoaded, reloadKey])

  return {
    failed: loadState === 'failed',
    isLoading: loadState === 'loading',
    retry,
  }
}
