import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export interface SpeciesRowProps {
  title: string;
  subtitle: string | null;
  badge?: string | null;
  imageUrl?: string | null;
  onPress: () => void;
}

/** One tappable species line (search result or identification candidate). */
export function SpeciesRow({ title, subtitle, badge, imageUrl, onPress }: SpeciesRowProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, badge].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.md,
          minHeight: minTouchTarget,
          gap: spacing.md,
          padding: spacing.md,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.thumbnail, { backgroundColor: colors.skeleton }]} />
      ) : (
        <View style={[styles.thumbnail, { backgroundColor: colors.surfaceMuted }]} />
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={[typography.body, { color: colors.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[typography.caption, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <Text style={[typography.caption, { color: colors.primary }]}>{badge}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
