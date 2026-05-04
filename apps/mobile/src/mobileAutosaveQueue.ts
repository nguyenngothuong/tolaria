import type { MobileEditorDraft } from './mobileEditorDraft'
import type { MobileEditorDraftSaveResult } from './mobileEditorDraftSave'
import {
  queuedMobileEditorSaveState,
  saveResultState,
  savingMobileEditorSaveState,
  failedMobileEditorSaveState,
  type MobileEditorSaveState,
} from './mobileEditorSaveState'

export type MobileAutosaveTimer = unknown

export type MobileAutosaveScheduler = {
  set: (callback: () => void, delayMs: number) => MobileAutosaveTimer
  clear: (timer: MobileAutosaveTimer) => void
}

export type MobileAutosaveQueue = {
  enqueue: (draft: MobileEditorDraft) => void
  cancelAll: () => void
}

export function createMobileAutosaveQueue({
  delayMs,
  onStateChange,
  saveDraft,
  scheduler = nativeScheduler,
}: {
  delayMs: number
  onStateChange: (noteId: string, state: MobileEditorSaveState) => void
  saveDraft: (draft: MobileEditorDraft) => Promise<MobileEditorDraftSaveResult>
  scheduler?: MobileAutosaveScheduler
}): MobileAutosaveQueue {
  const generationByNoteId = new Map<string, number>()
  const timerByNoteId = new Map<string, MobileAutosaveTimer>()

  return {
    enqueue: (draft) => {
      const generation = nextGeneration({ draft, generationByNoteId })
      clearPendingTimer({ draft, scheduler, timerByNoteId })
      onStateChange(draft.noteId, queuedMobileEditorSaveState)
      timerByNoteId.set(
        draft.noteId,
        scheduler.set(() => {
          timerByNoteId.delete(draft.noteId)
          void saveLatestDraft({ draft, generation, generationByNoteId, onStateChange, saveDraft })
        }, delayMs),
      )
    },
    cancelAll: () => {
      for (const timer of timerByNoteId.values()) {
        scheduler.clear(timer)
      }
      timerByNoteId.clear()
    },
  }
}

const nativeScheduler: MobileAutosaveScheduler = {
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
}

async function saveLatestDraft({
  draft,
  generation,
  generationByNoteId,
  onStateChange,
  saveDraft,
}: {
  draft: MobileEditorDraft
  generation: number
  generationByNoteId: Map<string, number>
  onStateChange: (noteId: string, state: MobileEditorSaveState) => void
  saveDraft: (draft: MobileEditorDraft) => Promise<MobileEditorDraftSaveResult>
}) {
  onStateChange(draft.noteId, savingMobileEditorSaveState)
  try {
    const result = await saveDraft(draft)
    if (isLatestGeneration({ draft, generation, generationByNoteId })) {
      onStateChange(draft.noteId, saveResultState(result))
    }
  } catch {
    if (isLatestGeneration({ draft, generation, generationByNoteId })) {
      onStateChange(draft.noteId, failedMobileEditorSaveState)
    }
  }
}

function nextGeneration({
  draft,
  generationByNoteId,
}: {
  draft: MobileEditorDraft
  generationByNoteId: Map<string, number>
}) {
  const generation = (generationByNoteId.get(draft.noteId) ?? 0) + 1
  generationByNoteId.set(draft.noteId, generation)

  return generation
}

function clearPendingTimer({
  draft,
  scheduler,
  timerByNoteId,
}: {
  draft: MobileEditorDraft
  scheduler: MobileAutosaveScheduler
  timerByNoteId: Map<string, MobileAutosaveTimer>
}) {
  const timer = timerByNoteId.get(draft.noteId)
  if (timer) {
    scheduler.clear(timer)
  }
}

function isLatestGeneration({
  draft,
  generation,
  generationByNoteId,
}: {
  draft: MobileEditorDraft
  generation: number
  generationByNoteId: Map<string, number>
}) {
  return generationByNoteId.get(draft.noteId) === generation
}
