import { useState } from 'react'
import { FileText, MagnifyingGlass, Plus, SidebarSimple, Star } from 'phosphor-react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { fixtureEditorBullets, fixtureNotes } from '../fixtures/workspaceFixtures'
import { mobileCopy } from '../i18n/mobileText'
import { MobileButton } from '../ui/MobileButton'
import { MobileChip } from '../ui/MobileChip'
import { MobileIconButton } from '../ui/MobileIconButton'
import { MobileListRow } from '../ui/MobileListRow'
import { MobilePanel, MobileToolbar, MobileToolbarSpacer, MobileToolbarTitle } from '../ui/MobilePanel'
import { MobilePropertyRow } from '../ui/MobilePropertyRow'
import { mobileColors, mobileSpace, mobileType } from '../ui/tokens'

export function TabletWorkspaceMock() {
  const [selectedNoteId, setSelectedNoteId] = useState(fixtureNotes[0].id)
  const selectedNote = fixtureNotes.find((note) => note.id === selectedNoteId) ?? fixtureNotes[0]

  return (
    <View style={styles.shell}>
      <SidebarPanel />
      <NoteListPanel selectedNoteId={selectedNoteId} onSelectNote={setSelectedNoteId} />
      <EditorPanel noteTitle={selectedNote.title} />
      <PropertiesPanel noteType={selectedNote.type} />
    </View>
  )
}

function SidebarPanel() {
  return (
    <MobilePanel style={styles.sidebar}>
      <MobileToolbar>
        <MobileIconButton accessibilityLabel="Sidebar">
          <SidebarSimple color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
      </MobileToolbar>
      <View style={styles.sidebarContent}>
        <SidebarItem active count="7" label={mobileCopy.inbox} />
        <SidebarItem count="8846" label={mobileCopy.allNotes} />
        <SidebarItem count="276" label={mobileCopy.archive} />
        <SectionTitle label={mobileCopy.favorites} />
        <SidebarItem label="Personal Journal" />
        <SidebarItem label="Tolaria MVP" />
        <SectionTitle label={mobileCopy.types} />
        <SidebarItem count="448" label="Essays" />
        <SidebarItem count="51" label="Procedures" />
        <SidebarItem count="18" label="Responsibilities" />
      </View>
    </MobilePanel>
  )
}

function NoteListPanel({
  onSelectNote,
  selectedNoteId,
}: {
  onSelectNote: (noteId: string) => void
  selectedNoteId: string
}) {
  return (
    <MobilePanel style={styles.noteList}>
      <MobileToolbar>
        <MobileToolbarTitle title={mobileCopy.inbox} />
        <MobileToolbarSpacer />
        <MobileIconButton accessibilityLabel={mobileCopy.searchNotes}>
          <MagnifyingGlass color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
        <MobileIconButton accessibilityLabel={mobileCopy.createNote}>
          <Plus color={mobileColors.textMuted} size={20} />
        </MobileIconButton>
      </MobileToolbar>
      <ScrollView>
        {fixtureNotes.map((note) => (
          <MobileListRow
            chips={<MobileChip label={note.type} tone="green" />}
            key={note.id}
            meta={`${mobileCopy.modified} ${note.modified}`}
            selected={note.id === selectedNoteId}
            subtitle={note.snippet}
            title={note.title}
            trailing={note.favorite ? <Star color={mobileColors.primary} size={16} weight="fill" /> : null}
            onPress={() => onSelectNote(note.id)}
          />
        ))}
      </ScrollView>
      <MobileButton
        icon={<Plus color={mobileColors.textInverse} size={16} />}
        label={mobileCopy.createNote}
        style={styles.compose}
        variant="primary"
      />
    </MobilePanel>
  )
}

function EditorPanel({ noteTitle }: { noteTitle: string }) {
  return (
    <MobilePanel style={styles.editor}>
      <MobileToolbar>
        <FileText color={mobileColors.textMuted} size={18} />
        <Text numberOfLines={1} style={styles.breadcrumb}>{mobileCopy.inbox} / {noteTitle}</Text>
      </MobileToolbar>
      <ScrollView contentContainerStyle={styles.editorContent}>
        <Text style={styles.editorTitle}>{noteTitle}</Text>
        {fixtureEditorBullets.map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.editorText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </MobilePanel>
  )
}

function PropertiesPanel({ noteType }: { noteType: string }) {
  return (
    <MobilePanel style={styles.properties}>
      <MobileToolbar>
        <MobileToolbarTitle title={mobileCopy.properties} />
      </MobileToolbar>
      <View style={styles.propertiesContent}>
        <MobilePropertyRow label="Type" value={<MobileChip label={noteType} tone="green" />} />
        <MobilePropertyRow label="Date" value="May 13, 2026" />
        <MobilePropertyRow label="Status" value="-" />
        <SectionTitle label="Relationships" />
        <MobileButton label="Add relationship" style={styles.fullWidthButton} variant="secondary" />
      </View>
    </MobilePanel>
  )
}

function SidebarItem({
  active = false,
  count,
  label,
}: {
  active?: boolean
  count?: string
  label: string
}) {
  return (
    <View style={[styles.sidebarItem, active ? styles.sidebarItemActive : null]}>
      <Text style={[styles.sidebarText, active ? styles.sidebarTextActive : null]}>{label}</Text>
      {count ? <Text style={styles.sidebarCount}>{count}</Text> : null}
    </View>
  )
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>
}

const styles = StyleSheet.create({
  breadcrumb: {
    flex: 1,
    color: mobileColors.textMuted,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  bullet: {
    color: mobileColors.primary,
    fontSize: 24,
    lineHeight: 30,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: mobileSpace.md,
    marginBottom: mobileSpace.lg,
  },
  compose: {
    bottom: mobileSpace.xl,
    position: 'absolute',
    right: mobileSpace.xl,
  },
  editor: {
    flex: 1,
  },
  editorContent: {
    alignSelf: 'center',
    maxWidth: 700,
    padding: mobileSpace.xxl,
    width: '100%',
  },
  editorText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.bodyLarge,
    lineHeight: 26,
  },
  editorTitle: {
    color: mobileColors.text,
    fontSize: mobileType.hero,
    fontWeight: '800',
    lineHeight: 40,
    marginBottom: mobileSpace.xl,
  },
  fullWidthButton: {
    marginTop: mobileSpace.lg,
  },
  noteList: {
    borderRightWidth: StyleSheet.hairlineWidth,
    width: 340,
  },
  properties: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    width: 300,
  },
  propertiesContent: {
    padding: mobileSpace.lg,
  },
  sectionTitle: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '700',
    marginTop: mobileSpace.xl,
    marginBottom: mobileSpace.sm,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: mobileColors.app,
  },
  sidebar: {
    width: 260,
    backgroundColor: mobileColors.sidebar,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sidebarContent: {
    padding: mobileSpace.md,
  },
  sidebarCount: {
    color: mobileColors.textMuted,
    fontSize: mobileType.caption,
    fontWeight: '600',
  },
  sidebarItem: {
    minHeight: 36,
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: 6,
    paddingHorizontal: mobileSpace.md,
  },
  sidebarItemActive: {
    backgroundColor: mobileColors.selected,
  },
  sidebarText: {
    flex: 1,
    color: mobileColors.text,
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  sidebarTextActive: {
    color: mobileColors.primary,
  },
})
