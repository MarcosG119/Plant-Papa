import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface TagProps {
  text: string;
  style?: StyleProp<ViewStyle>;
}

/** Small chip for species or category labels. */
export function Tag({ text, style }: TagProps) {
  const { colors, spacing, radius, typography } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      <Text style={[typography.caption as TextStyle, { color: colors.textMuted }]}>{text}</Text>
    </View>
  );
}
