import { StyleSheet, Text, TextInput, View, type TextStyle, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface InputProps extends TextInputProps {
  label: string;
  error?: string | null;
  containerStyle?: ViewStyle;
}

/** The one input atom: label, error display, and touch target handled once. */
export function Input({ label, error, containerStyle, style, ...inputProps }: InputProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  return (
    <View style={[styles.container, { gap: spacing.xs }, containerStyle]}>
      <Text style={[typography.caption as TextStyle, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.textMuted}
        style={[
          typography.body as TextStyle,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderRadius: radius.sm,
            paddingHorizontal: spacing.md,
            minHeight: minTouchTarget,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={[typography.caption as TextStyle, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
});
