import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from './tokens'

type MobileButtonVariant = 'primary' | 'secondary' | 'ghost'

export function MobileButton({
  disabled = false,
  icon,
  label,
  onPress,
  style,
  variant = 'secondary',
}: {
  disabled?: boolean
  icon?: ReactNode
  label: string
  onPress?: () => void
  style?: StyleProp<ViewStyle>
  variant?: MobileButtonVariant
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: mobileSpace.sm,
    borderRadius: mobileRadius.md,
    paddingHorizontal: mobileSpace.md,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: mobileType.body,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
})

const variantStyles = StyleSheet.create({
  ghost: {
    backgroundColor: 'transparent',
  },
  primary: {
    backgroundColor: mobileColors.primary,
  },
  secondary: {
    backgroundColor: mobileColors.control,
  },
})

const labelStyles = StyleSheet.create({
  ghost: {
    color: mobileColors.textMuted,
  },
  primary: {
    color: mobileColors.textInverse,
  },
  secondary: {
    color: mobileColors.text,
  },
})
