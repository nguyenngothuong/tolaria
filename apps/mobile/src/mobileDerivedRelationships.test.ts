import { describe, expect, it } from 'vitest'
import { mobileDerivedRelationshipGroups } from './mobileDerivedRelationships'
import type { MobileNote } from './mobileNoteProjection'

describe('mobile derived relationships', () => {
  it('derives read-only inverse relationship groups from other notes', () => {
    const current = note({ id: 'project/tolaria', title: 'Tolaria' })
    const child = note({ belongsTo: ['[[project/tolaria|Tolaria]]'], id: 'essay', title: 'Essay' })
    const related = note({ id: 'release', relatedTo: ['Tolaria'], title: 'Release' })
    const custom = note({ id: 'owner', relationships: { owner: ['[[project/tolaria|Tolaria]]'] }, title: 'Owner' })

    expect(mobileDerivedRelationshipGroups({ note: current, notes: [current, child, related, custom] })).toEqual([
      { label: 'Contains', targets: ['[[essay|Essay]]'] },
      { label: 'Related from', targets: ['[[release|Release]]'] },
      { label: 'Owner from', targets: ['[[owner|Owner]]'] },
    ])
  })

  it('deduplicates inverse targets inside a group', () => {
    const current = note({ id: 'project/tolaria', title: 'Tolaria' })
    const source = note({
      belongsTo: ['[[project/tolaria|Tolaria]]', 'Tolaria'],
      id: 'essay',
      title: 'Essay',
    })

    expect(mobileDerivedRelationshipGroups({ note: current, notes: [current, source] })).toEqual([
      { label: 'Contains', targets: ['[[essay|Essay]]'] },
    ])
  })
})

function note({
  belongsTo = [],
  has = [],
  id,
  relatedTo = [],
  relationships = {},
  title,
}: {
  belongsTo?: string[]
  has?: string[]
  id: string
  relatedTo?: string[]
  relationships?: Record<string, string[]>
  title: string
}): MobileNote {
  return {
    archived: false,
    backlinks: [],
    belongsTo,
    content: `# ${title}`,
    customProperties: {},
    date: '',
    favorite: false,
    favoriteIndex: null,
    has,
    icon: 'file-text',
    id,
    modified: '',
    outgoingLinks: [],
    relatedTo,
    relationships,
    snippet: '',
    status: undefined,
    tags: [],
    title,
    type: 'Note',
    words: 1,
  }
}
