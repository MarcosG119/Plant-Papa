import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface BadgeProps {
  text: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}

/** Status pill. Tone carries meaning beyond color through its text — never color alone. */
export function Badge({ text, tone = 'neutral', style }: BadgeProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const fg =
    tone === 'success'
      ? colors.success
      : tone === 'warning'
        ? colors.warning
        : tone === 'danger'
          ? colors.danger
          : colors.textMuted;

  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.full,
          paddingHorizontal: spacing.sm + 2,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      <Text style={[typography.caption as TextStyle, { color: fg }]}>{text}</Text>
    </View>
  );
}

