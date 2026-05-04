import { StyleSheet } from 'react-native'
import { colors } from '../theme'

export const editorSaveStateStyles = StyleSheet.create({
  editorSaveState: {
    marginLeft: 'auto',
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '700',
  },
  editorSaveState_idle: {
    color: colors.mutedText,
  },
  editorSaveState_queued: {
    color: colors.textSoft,
  },
  editorSaveState_saving: {
    color: colors.primary,
  },
  editorSaveState_saved: {
    color: colors.primary,
  },
  editorSaveState_blocked: {
    color: colors.textSoft,
  },
  editorSaveState_failed: {
    color: colors.text,
  },
})
