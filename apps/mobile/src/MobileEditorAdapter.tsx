import { useEffect, useMemo, useRef } from 'react'
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native'
import { RichText, Toolbar, useEditorBridge } from '@10play/tentap-editor'
import type { MobileNote } from './mobileNoteProjection'
import { createMobileEditorDraft, type MobileEditorDraft } from './mobileEditorDraft'
import { idleMobileEditorSaveState, type MobileEditorSaveState } from './mobileEditorSaveState'
import {
  createMobileEditorDocument,
  createMobileEditorHtml,
} from './mobileEditorDocument'
import { styles } from './styles'

export function MobileEditorAdapter({
  note,
  onDraftChange,
  saveState = idleMobileEditorSaveState,
}: {
  note: MobileNote
  onDraftChange?: (draft: MobileEditorDraft) => void
  saveState?: MobileEditorSaveState
}) {
  const document = useMemo(() => createMobileEditorDocument(note), [note])
  const initialContent = useMemo(() => createMobileEditorHtml(document), [document])
  const draftTargetRef = useRef({ note, onDraftChange })
  useEffect(() => {
    draftTargetRef.current = { note, onDraftChange }
  }, [note, onDraftChange])
  const editor = useEditorBridge({
    avoidIosKeyboard: true,
    initialContent,
    onChange: () => {
      const draftTarget = draftTargetRef.current
      void editor.getHTML().then((editorHtml) => {
        draftTarget.onDraftChange?.(createMobileEditorDraft({ editorHtml, note: draftTarget.note }))
      })
    },
  })

  return (
    <View style={styles.editorAdapterContent}>
      <View style={styles.breadcrumbRow}>
        <Text style={styles.breadcrumbText}>{note.type}</Text>
        <Text style={styles.breadcrumbDivider}>/</Text>
        <Text style={styles.breadcrumbText}>{note.id}</Text>
        <Text style={[styles.editorSaveState, saveStateStyle(saveState)]}>{saveState.label}</Text>
      </View>
      <View style={styles.tentapEditor}>
        <RichText key={note.id} editor={editor} />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.tentapToolbar}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>
    </View>
  )
}

function saveStateStyle(saveState: MobileEditorSaveState) {
  switch (saveState.state) {
    case 'blocked':
      return styles.editorSaveState_blocked
    case 'failed':
      return styles.editorSaveState_failed
    case 'queued':
      return styles.editorSaveState_queued
    case 'saved':
      return styles.editorSaveState_saved
    case 'saving':
      return styles.editorSaveState_saving
    default:
      return styles.editorSaveState_idle
  }
}
