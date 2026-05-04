import { StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'

export const vaultLoadStyles = StyleSheet.create({
  vaultLoadError: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderColor: colors.chipRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    backgroundColor: '#fff8f7',
  },
  vaultLoadErrorText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  vaultLoadRetry: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.primarySoft,
  },
  vaultLoadRetryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
})
