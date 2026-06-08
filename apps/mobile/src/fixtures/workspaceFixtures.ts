export type FixtureNote = {
  id: string
  title: string
  snippet: string
  type: string
  tags: string[]
  modified: string
  created: string
  favorite: boolean
}

export const fixtureNotes: FixtureNote[] = [
  {
    id: 'workflow-orchestration',
    title: 'Workflow Orchestration Essay',
    snippet: 'The current narrative and temptation: everything routed through an LLM.',
    type: 'Essay',
    tags: ['Design'],
    modified: '9h ago',
    created: '5d ago',
    favorite: true,
  },
  {
    id: 'open-source-project',
    title: 'How I Run an Open Source Project',
    snippet: 'Tolaria unexpected success: various sources of input, requests, and bugs.',
    type: 'Procedure',
    tags: ['Process'],
    modified: '10h ago',
    created: '10h ago',
    favorite: false,
  },
  {
    id: 'release-2026-05-02',
    title: 'v2026-05-02',
    snippet: 'Release cleanup date, bug fixes, and mobile planning notes.',
    type: 'Release',
    tags: ['Tolaria MVP'],
    modified: '12h ago',
    created: '1d ago',
    favorite: false,
  },
]

export const fixtureEditorBullets = [
  'The current narrative routes every workflow through an LLM surface.',
  'Tolaria should keep writing, relationships, and properties visible together.',
  'The mobile UI should match desktop semantics before phone-specific reduction.',
]
