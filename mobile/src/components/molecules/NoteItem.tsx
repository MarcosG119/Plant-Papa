import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { relativeTime } from '@/lib/relativeTime';

export interface NoteItemProps {
  text: string;
  updatedAt: Date;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** One note row: text plus relative last-update time. Tap enters edit mode upstream. */
export function NoteItem({ text, updatedAt, onPress, style }: NoteItemProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const content = (
    <View style={[{ gap: spacing.xs }]}>
      <Text style={[typography.body as TextStyle, { color: colors.text }]}>{text}</Text>
      <Text style={[typography.caption as TextStyle, { color: colors.textMuted }]}>
        {relativeTime(updatedAt)}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
        },
        style,
      ]}
    >
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Note: ${text}. Tap to edit.`}
          onPress={onPress}
        >
          {content}
        </Pressable>
      ) : (
        content
      )}
    </View>
  );
}
