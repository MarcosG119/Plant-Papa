import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { relativeTime } from '@/lib/relativeTime';

export interface CareDateRowProps {
  label: string;
  /** Null renders the gently urgent "never" state. */
  at: Date | null;
  style?: StyleProp<ViewStyle>;
}

/** "last watered 3d ago" row used on cards and plant pages. */
export function CareDateRow({ label, at, style }: CareDateRowProps) {
  const { colors, typography } = useTheme();

  const value = relativeTime(at);
  return (
    <View
      accessibilityLabel={`${label} ${value}`}
      style={[{ flexDirection: 'row', gap: 4, alignItems: 'baseline' }, style]}
    >
      <Text style={[typography.caption as TextStyle, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[typography.caption as TextStyle, { color: at === null ? colors.warning : colors.text }]}
      >
        {value}
      </Text>
    </View>
  );
}
