import { Image, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface AvatarProps {
  uri?: string | null;
  /** Falls back to initials when no image is available. */
  name: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

export function Avatar({ uri, name, size = 40, style }: AvatarProps) {
  const { colors, radius, typography } = useTheme();

  return (
    <View
      accessibilityLabel={`Avatar for ${name}`}
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius.full,
          backgroundColor: colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <Text
          style={[
            typography.subheading as TextStyle,
            { color: colors.textMuted, fontSize: size * 0.4, lineHeight: size * 0.5 },
          ]}
        >
          {initialsOf(name)}
        </Text>
      )}
    </View>
  );
}
