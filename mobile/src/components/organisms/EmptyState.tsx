import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Shared empty state inviting the first action. No ad-hoc spinners or blank screens. */
export function EmptyState({ title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[{ alignItems: 'center', gap: spacing.md, padding: spacing.xl }, style]}>
      <Text accessibilityRole="header" style={[typography.heading as TextStyle, { color: colors.text }]}>
        {title}
      </Text>
      {message ? (
        <Text style={[typography.body as TextStyle, { color: colors.textMuted, textAlign: 'center' }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}
