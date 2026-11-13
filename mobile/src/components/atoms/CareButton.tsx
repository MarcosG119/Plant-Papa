import { Pressable, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { relativeTime } from '@/lib/relativeTime';

export interface CareButtonProps {
  kind: 'water' | 'fertilize';
  /** Last time this care action happened; null shows the urgent "never" style. */
  lastAt: Date | null;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const LABELS = {
  water: 'Water',
  fertilize: 'Feed',
} as const;

/** Big friendly care action with its relative last-performed time. */
export function CareButton({ kind, lastAt, onPress, disabled = false, style }: CareButtonProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  const never = lastAt === null;
  const label = `${LABELS[kind]}, ${never ? 'never done' : `last ${relativeTime(lastAt)}`}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.md,
          minHeight: minTouchTarget,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          alignItems: 'center',
          gap: 2,
        },
        pressed && { opacity: 0.7 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text style={[typography.button as TextStyle, { color: colors.primary }]}>{LABELS[kind]}</Text>
      <Text style={[typography.caption as TextStyle, { color: never ? colors.warning : colors.textMuted }]}>
        {never ? 'never' : relativeTime(lastAt)}
      </Text>
    </Pressable>
  );
}
