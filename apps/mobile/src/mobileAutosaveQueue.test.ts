import { describe, expect, it } from 'vitest'
import { createMobileEditorDraft, type MobileEditorDraft } from './mobileEditorDraft'
import { createMobileAutosaveQueue, type MobileAutosaveScheduler } from './mobileAutosaveQueue'
import type { MobileEditorSaveState } from './mobileEditorSaveState'

describe('mobile autosave queue', () => {
  it('debounces drafts for the same note', async () => {
    const scheduler = createManualScheduler()
    const savedDrafts: MobileEditorDraft[] = []
    const states: string[] = []
    const queue = createMobileAutosaveQueue({
      delayMs: 300,
      scheduler,
      onStateChange: (_noteId, state) => states.push(state.state),
      saveDraft: async (draft) => {
        savedDrafts.push(draft)
        return { status: 'saved', path: `${draft.noteId}.md` }
      },
    })

    queue.enqueue(draftFor('workflow', '<h1>Workflow</h1><p>First</p>'))
    queue.enqueue(draftFor('workflow', '<h1>Workflow</h1><p>Second</p>'))

    await scheduler.flush()

    expect(savedDrafts).toHaveLength(1)
    expect(savedDrafts[0]).toMatchObject({ canonicalMarkdown: '# Workflow\n\nSecond' })
    expect(states).toEqual(['queued', 'queued', 'saving', 'saved'])
  })

  it('ignores stale save results when a newer draft was queued', async () => {
    const scheduler = createManualScheduler()
    const states: MobileEditorSaveState[] = []
    let resolveFirstSave: () => void = () => {
      throw new Error('First save was not scheduled')
    }
    const queue = createMobileAutosaveQueue({
      delayMs: 300,
      scheduler,
      onStateChange: (_noteId, state) => states.push(state),
      saveDraft: (draft) =>
        draftMarkdown(draft).includes('First')
          ? new Promise((resolve) => {
              resolveFirstSave = () => resolve({ status: 'saved', path: `${draft.noteId}.md` })
            })
          : Promise.resolve({ status: 'saved', path: `${draft.noteId}.md` }),
    })

    queue.enqueue(draftFor('workflow', '<h1>Workflow</h1><p>First</p>'))
    await scheduler.flush()
    queue.enqueue(draftFor('workflow', '<h1>Workflow</h1><p>Second</p>'))
    resolveFirstSave()
    await Promise.resolve()
    await scheduler.flush()

    expect(states.map((state) => state.state)).toEqual(['queued', 'saving', 'queued', 'saving', 'saved'])
  })

  it('can cancel pending draft saves', async () => {
    const scheduler = createManualScheduler()
    const savedDrafts: MobileEditorDraft[] = []
    const queue = createMobileAutosaveQueue({
      delayMs: 300,
      scheduler,
      onStateChange: () => {},
      saveDraft: async (draft) => {
        savedDrafts.push(draft)
        return { status: 'saved', path: `${draft.noteId}.md` }
      },
    })

    queue.enqueue(draftFor('workflow', '<h1>Workflow</h1><p>First</p>'))
    queue.cancelAll()
    await scheduler.flush()

    expect(savedDrafts).toEqual([])
  })
})

function draftFor(noteId: string, editorHtml: string) {
  return createMobileEditorDraft({
    note: { id: noteId, title: 'Workflow', content: '# Workflow' },
    editorHtml,
  })
}

function draftMarkdown(draft: MobileEditorDraft) {
  if (!draft.persistable) {
    throw new Error('Expected persistable test draft')
  }

  return draft.canonicalMarkdown
}

function createManualScheduler() {
  type ManualTimer = {
    callback: () => void
    active: boolean
  }
  const timers: ManualTimer[] = []
  const scheduler: MobileAutosaveScheduler & { flush: () => Promise<void> } = {
    set: (callback) => {
      const timer = { callback, active: true }
      timers.push(timer)

      return timer
    },
    clear: (timer) => {
      const manualTimer = timer as unknown as ManualTimer
      manualTimer.active = false
    },
    flush: async () => {
      const activeTimers = timers.splice(0).filter((timer) => timer.active)
      for (const timer of activeTimers) {
        timer.callback()
      }
      await Promise.resolve()
    },
  }

  return scheduler
}
