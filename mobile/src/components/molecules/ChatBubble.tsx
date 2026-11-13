import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { relativeTime } from '@/lib/relativeTime';

export interface ChatBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  sentAt?: Date | null;
  /** Marks a pending assistant reply (typing indicator look). */
  pending?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** One chat message. User bubbles align right on the brand color; assistant left on surface. */
export function ChatBubble({ role, text, sentAt, pending = false, style }: ChatBubbleProps) {
  const { colors, spacing, radius, typography } = useTheme();

  const isUser = role === 'user';

  return (
    <View
      accessibilityLabel={`${isUser ? 'Your message' : 'Plant helper'}: ${text}`}
      style={[
        {
          backgroundColor: isUser ? colors.primary : colors.surface,
          borderRadius: radius.lg,
          borderTopRightRadius: isUser ? radius.sm : radius.lg,
          borderTopLeftRadius: isUser ? radius.lg : radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm + 2,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isUser ? 'transparent' : colors.border,
          maxWidth: '85%',
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          opacity: pending ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text style={[typography.body as TextStyle, { color: isUser ? colors.onPrimary : colors.text }]}>
        {pending ? '…' : text}
      </Text>
      {sentAt ? (
        <Text
          style={[
            typography.caption as TextStyle,
            { color: isUser ? colors.onPrimary : colors.textMuted, fontSize: 11, marginTop: spacing.xs },
          ]}
        >
          {relativeTime(sentAt)}
        </Text>
      ) : null}
    </View>
  );
}
