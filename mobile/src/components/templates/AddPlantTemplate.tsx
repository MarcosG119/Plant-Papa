import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface AddPlantTemplateProps {
  /** Slot: step title row with the back affordance. */
  header: ReactNode;
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** Add-a-plant layout: header, scrollable body. Owns no content. */
export function AddPlantTemplate({ header, children, contentContainerStyle }: AddPlantTemplateProps) {
  const { colors, spacing } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        {header}
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[{ paddingBottom: spacing.xl }, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({});
