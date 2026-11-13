import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Shared error state with a retry affordance tied to the snapshot's error. */
export function ErrorState({ message = 'Something went wrong.', onRetry, style }: ErrorStateProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={[{ alignItems: 'center', gap: spacing.md, padding: spacing.xl }, style]}>
      <Text accessibilityRole="alert" style={[typography.subheading as TextStyle, { color: colors.danger }]}>
        {message}
      </Text>
      {onRetry ? <Button label="Try again" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
