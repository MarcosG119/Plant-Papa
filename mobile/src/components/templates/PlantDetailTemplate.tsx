import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/theme';

export type PlantDetailTab = 'care' | 'notes' | 'gallery' | 'chat';

export interface PlantDetailTemplateProps {
  /** Sticky header slot: cover photo, name, species, Water/Feed buttons. */
  header: ReactNode;
  /** Tab bar slot: rendered between header and content. */
  tabBar: ReactNode;
  /** Active tab's content slot. */
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** Plant page layout: sticky header, tab bar, scrollable tab content. Owns no content. */
export function PlantDetailTemplate({ header, tabBar, children, contentContainerStyle }: PlantDetailTemplateProps) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header}
      {tabBar}
      <ScrollView contentContainerStyle={contentContainerStyle}>{children}</ScrollView>
    </View>
  );
}
