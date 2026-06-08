import { describe, expect, it } from 'vitest'
import { fixtureEditorBullets, fixtureNotes } from './workspaceFixtures'

describe('workspaceFixtures', () => {
  it('keeps the tablet UI lab anchored on a selected essay note', () => {
    expect(fixtureNotes[0]).toMatchObject({
      id: 'workflow-orchestration',
      type: 'Essay',
    })
    expect(fixtureEditorBullets).toHaveLength(3)
  })
})
