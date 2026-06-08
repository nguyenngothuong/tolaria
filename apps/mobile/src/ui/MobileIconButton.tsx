import type { ReactNode } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { mobileColors, mobileRadius } from './tokens'

export function MobileIconButton({
  accessibilityLabel,
  children,
  onPress,
  selected = false,
}: {
  accessibilityLabel: string
  children: ReactNode
  onPress?: () => void
  selected?: boolean
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected ? styles.selected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: mobileRadius.md,
    backgroundColor: mobileColors.card,
  },
  pressed: {
    opacity: 0.68,
  },
  selected: {
    backgroundColor: mobileColors.selected,
  },
})
