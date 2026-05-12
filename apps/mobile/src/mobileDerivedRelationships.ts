import type { MobileNote } from './mobileNoteProjection'
import { hasMobileRelationshipRef, mobileWikilinkForNote, uniqueMobileRelationshipRefs } from './mobileRelationshipRefs'

export type MobileDerivedRelationshipGroup = {
  label: string
  targets: string[]
}

export function mobileDerivedRelationshipGroups({
  note,
  notes,
}: {
  note: MobileNote
  notes: MobileNote[]
}) {
  const groups = new Map<string, string[]>()
  for (const source of notes) {
    if (source.id !== note.id) {
      appendDerivedGroups({ groups, note, source })
    }
  }

  return [...groups.entries()]
    .map(([label, targets]) => ({ label, targets: uniqueMobileRelationshipRefs(targets) }))
    .filter((group) => group.targets.length > 0)
}

function appendDerivedGroups({
  groups,
  note,
  source,
}: {
  groups: Map<string, string[]>
  note: MobileNote
  source: MobileNote
}) {
  appendIfLinked({ groups, label: 'Contains', note, source, values: source.belongsTo })
  appendIfLinked({ groups, label: 'Related from', note, source, values: source.relatedTo })
  appendIfLinked({ groups, label: 'Part of', note, source, values: source.has })
  for (const [key, values] of Object.entries(source.relationships)) {
    appendIfLinked({ groups, label: `${formatRelationshipLabel(key)} from`, note, source, values })
  }
}

function appendIfLinked({
  groups,
  label,
  note,
  source,
  values,
}: {
  groups: Map<string, string[]>
  label: string
  note: MobileNote
  source: MobileNote
  values: string[]
}) {
  if (
    hasMobileRelationshipRef({ target: mobileWikilinkForNote(note), values })
    || hasMobileRelationshipRef({ target: note.title, values })
  ) {
    groups.set(label, [...groups.get(label) ?? [], mobileWikilinkForNote(source)])
  }
}

function formatRelationshipLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
