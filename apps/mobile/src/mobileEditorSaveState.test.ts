import { describe, expect, it } from 'vitest'
import {
  failedMobileEditorSaveState,
  idleMobileEditorSaveState,
  queuedMobileEditorSaveState,
  saveResultState,
  savingMobileEditorSaveState,
} from './mobileEditorSaveState'

describe('mobile editor save state', () => {
  it('provides stable labels for direct save states', () => {
    expect(idleMobileEditorSaveState.label).toBe('Ready')
    expect(queuedMobileEditorSaveState.label).toBe('Edited')
    expect(savingMobileEditorSaveState.label).toBe('Saving')
    expect(failedMobileEditorSaveState.label).toBe('Save failed')
  })

  it('derives visible state from save results', () => {
    expect(saveResultState({ status: 'saved', path: 'workflow.md' })).toEqual({
      state: 'saved',
      label: 'Saved',
    })
    expect(saveResultState({ status: 'blocked', reason: 'unsupportedEditorHtml' })).toEqual({
      state: 'blocked',
      label: 'Blocked',
    })
  })
})
