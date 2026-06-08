import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native'
import { mobileColors, mobileRadius, mobileSpace, mobileType } from './tokens'

type MobileChipTone = 'blue' | 'green' | 'orange' | 'purple'

export function MobileChip({
  label,
  style,
  tone = 'green',
}: {
  label: string
  style?: StyleProp<TextStyle>
  tone?: MobileChipTone
}) {
  return <Text style={[styles.base, toneStyles[tone], style]}>{label}</Text>
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderRadius: mobileRadius.sm,
    fontSize: mobileType.caption,
    fontWeight: '600',
    paddingHorizontal: mobileSpace.sm,
    paddingVertical: mobileSpace.xs,
  },
})

const toneStyles = StyleSheet.create({
  blue: {
    backgroundColor: mobileColors.primarySoft,
    color: mobileColors.primary,
  },
  green: {
    backgroundColor: mobileColors.greenSoft,
    color: mobileColors.green,
  },
  orange: {
    backgroundColor: mobileColors.orangeSoft,
    color: mobileColors.orange,
  },
  purple: {
    backgroundColor: mobileColors.purpleSoft,
    color: mobileColors.purple,
  },
})
