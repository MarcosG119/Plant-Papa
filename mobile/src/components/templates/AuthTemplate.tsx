import { KeyboardAvoidingView, Platform, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { useTheme } from '@/theme';

export interface AuthTemplateProps {
  /** Top slot: app mark and screen title. */
  title?: ReactNode;
  /** Body slot: form fields and primary actions. */
  children: ReactNode;
  /** Bottom slot: links ("Don't have an account? Sign up"). */
  footer?: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/** Auth screens layout: centered scrollable form with keyboard avoidance. Owns no content. */
export function AuthTemplate({ title, children, footer, contentContainerStyle }: AuthTemplateProps) {
  const { colors, spacing } = useTheme();

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          { flexGrow: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
          contentContainerStyle,
        ]}
      >
        {title ? <View>{title}</View> : null}
        <View style={{ gap: spacing.md }}>{children}</View>
        {footer ? <View style={{ alignItems: 'center' }}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
