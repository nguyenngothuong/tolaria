import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import {
  CaretLeft,
  DotsThreeVertical,
  Info,
  List,
  MagnifyingGlass,
  PencilSimple,
  SlidersHorizontal,
  Trash,
} from 'phosphor-react-native'
import { MobileNote, notes as fallbackNotes, sidebarSections } from './demoData'
import { createDemoVaultNote, deleteDemoVaultNote, loadDemoVaultNotes, saveDemoVaultDraft } from './mobileDemoVault'
import { createMobileAutosaveQueue } from './mobileAutosaveQueue'
import type { MobileEditorDraft } from './mobileEditorDraft'
import {
  idleMobileEditorSaveState,
  type MobileEditorSaveState,
} from './mobileEditorSaveState'
import { applySavedMobileEditorDraft } from './mobileSavedDraftProjection'
import { MobileEditorAdapter } from './MobileEditorAdapter'
import {
  createCompactNavigationState,
  transitionCompactNavigation,
  type CompactNavigationEvent,
  type CompactPanel,
} from './compactNavigation'
import { NamedIcon, type IconName } from './NamedIcon'
import { SwipeSurface } from './SwipeSurface'
import { styles } from './styles'
import { colors } from './theme'
import { MobileNoteCreatePrompt } from './MobileNoteCreatePrompt'
import { useMobileNoteCreateFlow } from './useMobileNoteCreateFlow'
import { useMobileNoteDeleteFlow } from './useMobileNoteDeleteFlow'
import { createNativeMobileAppStateStorage } from './mobileNativeAppStateStorage'
import { defaultMobileVaultMetadata } from './mobileVaultMetadata'

const activeMobileVaultId = defaultMobileVaultMetadata.id

export function MobileApp() {
  const { width } = useWindowDimensions()
  const isTablet = width >= 820
  const showsProperties = width >= 1120
  const appStateStorage = useMemo(() => createNativeMobileAppStateStorage(), [])
  const [availableNotes, setAvailableNotes] = useState(fallbackNotes)
  const [compactNavigation, setCompactNavigation] = useState(() => createCompactNavigationState(fallbackNotes[0].id))
  const [saveStateByNoteId, setSaveStateByNoteId] = useState<Record<string, MobileEditorSaveState>>({})
  const selectedNote = useMemo(
    () => availableNotes.find((note) => note.id === compactNavigation.selectedNoteId) ?? availableNotes[0],
    [availableNotes, compactNavigation.selectedNoteId],
  )
  const selectedSaveState = saveStateByNoteId[selectedNote.id] ?? idleMobileEditorSaveState
  const autosaveQueue = useMemo(
    () =>
      createMobileAutosaveQueue({
        delayMs: 700,
        saveDraft: saveDemoVaultDraft,
        onStateChange: (noteId, saveState) => {
          setSaveStateByNoteId((state) => ({ ...state, [noteId]: saveState }))
        },
        onSavedDraft: (draft) => {
          setAvailableNotes((notes) => applySavedMobileEditorDraft({ draft, notes }))
        },
      }),
    [],
  )

  useEffect(() => {
    let isActive = true

    Promise.all([loadDemoVaultNotes(), appStateStorage.load(activeMobileVaultId)])
      .then(([loadedNotes, appState]) => {
        if (isActive && loadedNotes.length > 0) {
          setAvailableNotes(loadedNotes)
          setCompactNavigation((state) => selectLoadedNote(state, loadedNotes, appState.selectedNoteId))
        }
      })
      .catch(() => {})

    return () => {
      isActive = false
    }
  }, [appStateStorage])

  useEffect(() => () => autosaveQueue.cancelAll(), [autosaveQueue])

  const selectNoteId = useCallback((noteId: string) => {
    setCompactNavigation((state) => transitionCompactNavigation(state, { type: 'selectNote', noteId }))
    void appStateStorage.save({ activeVaultId: activeMobileVaultId, selectedNoteId: noteId }).catch(() => {})
  }, [appStateStorage])
  const selectNote = useCallback((note: MobileNote) => selectNoteId(note.id), [selectNoteId])
  const saveDraft = useCallback((draft: MobileEditorDraft) => autosaveQueue.enqueue(draft), [autosaveQueue])
  const deleteFlow = useMobileNoteDeleteFlow({
    deleteNote: deleteDemoVaultNote,
    loadNotes: loadDemoVaultNotes,
    notes: availableNotes,
    onNotesLoaded: setAvailableNotes,
    onSelectedNoteId: selectNoteId,
    selectedNoteId: selectedNote.id,
  })
  const createFlow = useMobileNoteCreateFlow({
    createNote: (title) => createDemoVaultNote({ title }),
    onCreated: (note) => {
      setAvailableNotes((notes) => [note, ...notes.filter((item) => item.id !== note.id)])
      selectNoteId(note.id)
    },
  })

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        {isTablet ? (
          <View style={styles.tabletShell}>
            <SidebarPanel />
            <NoteListPanel
              notes={availableNotes}
              selectedNoteId={compactNavigation.selectedNoteId}
              createNoteFailed={createFlow.failed}
              createNoteTitle={createFlow.title}
              isCreatePromptOpen={createFlow.isPromptOpen}
              isCreatingNote={createFlow.isCreating}
              onCancelCreateNote={createFlow.cancel}
              onChangeCreateNoteTitle={createFlow.setTitle}
              onOpenCreateNote={createFlow.open}
              onSubmitCreateNote={createFlow.submit}
              onSelectNote={selectNote}
            />
            <EditorPanel
              note={selectedNote}
              saveState={selectedSaveState}
              onDeleteNote={deleteFlow.canDelete ? deleteFlow.deleteSelectedNote : undefined}
              onDraftChange={saveDraft}
            />
            {showsProperties ? <PropertiesPanel note={selectedNote} /> : null}
          </View>
        ) : (
          <CompactShell
            activePanel={compactNavigation.panel}
            note={selectedNote}
            notes={availableNotes}
            saveState={selectedSaveState}
            selectedNoteId={compactNavigation.selectedNoteId}
            onNavigate={(event) => setCompactNavigation((state) => transitionCompactNavigation(state, event))}
            onDeleteNote={deleteFlow.canDelete ? deleteFlow.deleteSelectedNote : undefined}
            onDraftChange={saveDraft}
            createNoteFailed={createFlow.failed}
            createNoteTitle={createFlow.title}
            isCreatePromptOpen={createFlow.isPromptOpen}
            isCreatingNote={createFlow.isCreating}
            onCancelCreateNote={createFlow.cancel}
            onChangeCreateNoteTitle={createFlow.setTitle}
            onOpenCreateNote={createFlow.open}
            onSubmitCreateNote={createFlow.submit}
            onSelectNote={selectNote}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

function CompactShell({
  activePanel,
  note,
  notes,
  saveState,
  onNavigate,
  onDeleteNote,
  onDraftChange,
  createNoteFailed,
  createNoteTitle,
  isCreatePromptOpen,
  isCreatingNote,
  onCancelCreateNote,
  onChangeCreateNoteTitle,
  onOpenCreateNote,
  onSubmitCreateNote,
  onSelectNote,
  selectedNoteId,
}: {
  activePanel: CompactPanel
  note: MobileNote
  notes: MobileNote[]
  saveState: MobileEditorSaveState
  createNoteFailed: boolean
  createNoteTitle: string
  isCreatePromptOpen: boolean
  isCreatingNote: boolean
  onNavigate: (event: CompactNavigationEvent) => void
  onDeleteNote?: () => void
  onDraftChange: (draft: MobileEditorDraft) => void
  onCancelCreateNote: () => void
  onChangeCreateNoteTitle: (title: string) => void
  onOpenCreateNote: () => void
  onSubmitCreateNote: () => void
  onSelectNote: (note: MobileNote) => void
  selectedNoteId: string
}) {
  if (activePanel === 'sidebar') {
    return (
      <SwipeSurface panel="sidebar" onNavigate={onNavigate}>
        <SidebarPanel onClose={() => onNavigate({ type: 'closeSidebar' })} />
      </SwipeSurface>
    )
  }

  if (activePanel === 'note') {
    return (
      <SwipeSurface panel="note" onNavigate={onNavigate}>
        <EditorPanel
          note={note}
          saveState={saveState}
          onDeleteNote={onDeleteNote}
          onDraftChange={onDraftChange}
          onBack={() => onNavigate({ type: 'backToList' })}
          onOpenProperties={() => onNavigate({ type: 'openProperties' })}
        />
      </SwipeSurface>
    )
  }

  if (activePanel === 'properties') {
    return (
      <SwipeSurface panel="properties" onNavigate={onNavigate}>
        <PropertiesPanel note={note} onClose={() => onNavigate({ type: 'closeProperties' })} />
      </SwipeSurface>
    )
  }

  return (
    <SwipeSurface panel="list" onNavigate={onNavigate}>
      <NoteListPanel
        notes={notes}
        selectedNoteId={selectedNoteId}
        createNoteFailed={createNoteFailed}
        createNoteTitle={createNoteTitle}
        isCreatePromptOpen={isCreatePromptOpen}
        isCreatingNote={isCreatingNote}
        onCancelCreateNote={onCancelCreateNote}
        onChangeCreateNoteTitle={onChangeCreateNoteTitle}
        onOpenCreateNote={onOpenCreateNote}
        onOpenSidebar={() => onNavigate({ type: 'openSidebar' })}
        onSelectNote={onSelectNote}
        onSubmitCreateNote={onSubmitCreateNote}
      />
    </SwipeSurface>
  )
}

function SidebarPanel({ onClose }: { onClose?: () => void }) {
  return (
    <View style={styles.sidebar}>
      <Toolbar>
        {onClose ? <IconButton icon={<CaretLeft size={24} color={colors.textSoft} />} onPress={onClose} /> : null}
        <View style={styles.toolbarSpacer} />
        <IconButton icon={<SlidersHorizontal size={22} color={colors.textSoft} />} />
      </Toolbar>
      <ScrollView contentContainerStyle={styles.sidebarContent}>
        {sidebarSections.map((section) => (
          <View key={section.title} style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.sidebarItem,
                  item.id === 'inbox' ? styles.sidebarItemSelected : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <NamedIcon name={item.icon as IconName} size={20} color={item.id === 'inbox' ? colors.primary : colors.iconMuted} />
                <Text style={styles.sidebarItemText}>{item.label}</Text>
                {item.count > 0 ? <Text style={styles.sidebarCount}>{item.count}</Text> : null}
              </Pressable>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function NoteListPanel({
  notes,
  createNoteFailed,
  createNoteTitle,
  isCreatePromptOpen,
  isCreatingNote,
  onCancelCreateNote,
  onChangeCreateNoteTitle,
  onOpenCreateNote,
  onOpenSidebar,
  onSelectNote,
  onSubmitCreateNote,
  selectedNoteId,
}: {
  notes: MobileNote[]
  createNoteFailed: boolean
  createNoteTitle: string
  isCreatePromptOpen: boolean
  isCreatingNote: boolean
  onCancelCreateNote: () => void
  onChangeCreateNoteTitle: (title: string) => void
  onOpenCreateNote: () => void
  onOpenSidebar?: () => void
  onSelectNote: (note: MobileNote) => void
  onSubmitCreateNote: () => void
  selectedNoteId: string
}) {
  return (
    <View style={styles.noteList}>
      <Toolbar>
        {onOpenSidebar ? <IconButton icon={<List size={25} color={colors.textSoft} />} onPress={onOpenSidebar} /> : null}
        <Text style={styles.listTitle}>Inbox</Text>
        <View style={styles.toolbarSpacer} />
        <IconButton icon={<MagnifyingGlass size={23} color={colors.textSoft} />} />
      </Toolbar>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.noteListContent}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectNote(item)}
            style={({ pressed }) => [
              styles.noteRow,
              item.id === selectedNoteId ? styles.noteRowSelected : null,
              pressed ? styles.pressed : null,
            ]}
          >
            <View style={styles.noteRowHeader}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              <NamedIcon name={item.icon as IconName} size={18} color={colors.primary} />
            </View>
            <Text numberOfLines={2} style={styles.noteSnippet}>{item.snippet}</Text>
            <View style={styles.noteMetaRow}>
              <Text style={styles.noteMeta}>{item.modified}</Text>
              <Text style={styles.noteMeta}>Created {item.date}</Text>
            </View>
            <View style={styles.tagRow}>
              {item.tags.slice(0, 2).map((tag) => <Tag key={tag} label={tag} />)}
            </View>
          </Pressable>
        )}
      />
      {isCreatePromptOpen ? (
        <MobileNoteCreatePrompt
          failed={createNoteFailed}
          isCreating={isCreatingNote}
          onCancel={onCancelCreateNote}
          onChangeTitle={onChangeCreateNoteTitle}
          onSubmit={onSubmitCreateNote}
          title={createNoteTitle}
        />
      ) : null}
      <Pressable
        accessibilityLabel="Create note"
        disabled={isCreatingNote}
        onPress={onOpenCreateNote}
        style={({ pressed }) => [
          styles.composeButton,
          isCreatingNote ? styles.composeButtonDisabled : null,
          pressed ? styles.pressed : null,
        ]}
      >
        <PencilSimple size={28} color="#ffffff" />
      </Pressable>
    </View>
  )
}

function selectLoadedNote(
  state: ReturnType<typeof createCompactNavigationState>,
  loadedNotes: MobileNote[],
  preferredNoteId: string | null,
) {
  if (preferredNoteId && loadedNotes.some((note) => note.id === preferredNoteId)) {
    return { ...state, selectedNoteId: preferredNoteId }
  }

  return loadedNotes.some((note) => note.id === state.selectedNoteId)
    ? state
    : { ...state, selectedNoteId: loadedNotes[0].id }
}

function EditorPanel({
  note,
  saveState,
  onDeleteNote,
  onDraftChange,
  onBack,
  onOpenProperties,
}: {
  note: MobileNote
  saveState?: MobileEditorSaveState
  onDeleteNote?: () => void
  onDraftChange?: (draft: MobileEditorDraft) => void
  onBack?: () => void
  onOpenProperties?: () => void
}) {
  return (
    <View style={styles.editor}>
      <Toolbar>
        {onBack ? <IconButton icon={<CaretLeft size={25} color={colors.textSoft} />} onPress={onBack} /> : null}
        <View style={styles.toolbarSpacer} />
        {onOpenProperties ? <IconButton icon={<Info size={23} color={colors.textSoft} />} onPress={onOpenProperties} /> : null}
        {onDeleteNote ? <IconButton icon={<Trash size={23} color={colors.textSoft} />} onPress={onDeleteNote} /> : null}
        <IconButton icon={<DotsThreeVertical size={23} color={colors.textSoft} />} />
      </Toolbar>
      <MobileEditorAdapter note={note} saveState={saveState} onDraftChange={onDraftChange} />
    </View>
  )
}

function PropertiesPanel({ note, onClose }: { note: MobileNote; onClose?: () => void }) {
  return (
    <View style={styles.properties}>
      <Toolbar>
        <Text style={styles.propertiesTitle}>Properties</Text>
        <View style={styles.toolbarSpacer} />
        {onClose ? <IconButton icon={<CaretLeft size={23} color={colors.textSoft} />} onPress={onClose} /> : null}
      </Toolbar>
      <ScrollView contentContainerStyle={styles.propertiesContent}>
        <PropertyRow label="Type" value={note.type} />
        <PropertyRow label="Date" value={note.date} />
        <PropertyRow label="Words" value={String(note.words)} />
        <PropertyRow label="Modified" value={note.modified} />
        <Text style={styles.propertyGroupTitle}>Tags</Text>
        <View style={styles.tagRow}>
          {note.tags.map((tag) => <Tag key={tag} label={tag} />)}
        </View>
        <Text style={styles.propertyGroupTitle}>History</Text>
        <Text style={styles.historyItem}>eb373865c - Updated 1 note</Text>
        <Text style={styles.historyItem}>5e853fdfe - Updated 1 note</Text>
      </ScrollView>
    </View>
  )
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <View style={styles.toolbar}>{children}</View>
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed ? styles.pressed : null]}>
      {icon}
    </Pressable>
  )
}

function PropertyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.propertyRow}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <Text style={styles.propertyValue}>{value}</Text>
    </View>
  )
}

function Tag({ label }: { label: string }) {
  return <Text style={styles.tag}>{label}</Text>
}
