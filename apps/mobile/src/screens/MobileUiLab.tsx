import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { TabletWorkspaceMock } from './TabletWorkspaceMock'
import { mobileColors } from '../ui/tokens'

export function MobileUiLab() {
  const { width } = useWindowDimensions()
  const isWideEnoughForTablet = width >= 900

  if (isWideEnoughForTablet) {
    return <TabletWorkspaceMock />
  }

  return (
    <ScrollView horizontal style={styles.scroller}>
      <View style={styles.tabletPreview}>
        <TabletWorkspaceMock />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroller: {
    flex: 1,
    backgroundColor: mobileColors.app,
  },
  tabletPreview: {
    width: 1100,
    flex: 1,
  },
})
