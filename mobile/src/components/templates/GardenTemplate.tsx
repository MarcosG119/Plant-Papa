import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/theme';

export interface GardenTemplateProps {
  /** Header slot: title, plant count, filters. */
  header?: ReactNode;
  /** Body slot: the plant grid or a shared state (empty/loading/error). */
  children: ReactNode;
  /** Bottom action slot: the floating add button. */
  floatingAction?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** My Garden layout: header, scrollable body, floating action. Owns no content. */
export function GardenTemplate({
  header,
  children,
  floatingAction,
  contentContainerStyle,
}: GardenTemplateProps) {
  const { colors, spacing } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {header ? (
        <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
          {header}
        </View>
      ) : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={contentContainerStyle}>
        {children}
      </ScrollView>
      {floatingAction}
    </View>
  );
}
