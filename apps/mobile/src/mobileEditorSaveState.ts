import type { MobileEditorDraftSaveResult } from './mobileEditorDraftSave'

export type MobileEditorSaveState =
  | {
      state: 'idle'
      label: 'Ready'
    }
  | {
      state: 'queued'
      label: 'Edited'
    }
  | {
      state: 'saving'
      label: 'Saving'
    }
  | {
      state: 'saved'
      label: 'Saved'
    }
  | {
      state: 'blocked'
      label: 'Blocked'
    }
  | {
      state: 'failed'
      label: 'Save failed'
    }

export const idleMobileEditorSaveState: MobileEditorSaveState = {
  state: 'idle',
  label: 'Ready',
}

export const queuedMobileEditorSaveState: MobileEditorSaveState = {
  state: 'queued',
  label: 'Edited',
}

export const savingMobileEditorSaveState: MobileEditorSaveState = {
  state: 'saving',
  label: 'Saving',
}

export const failedMobileEditorSaveState: MobileEditorSaveState = {
  state: 'failed',
  label: 'Save failed',
}

export function saveResultState(result: MobileEditorDraftSaveResult): MobileEditorSaveState {
  return result.status === 'saved'
    ? { state: 'saved', label: 'Saved' }
    : { state: 'blocked', label: 'Blocked' }
}
