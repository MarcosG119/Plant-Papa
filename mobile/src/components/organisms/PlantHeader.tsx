import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { CareButton } from '@/components/atoms/CareButton';
import { formatDate } from '@/lib/dates';

export interface PlantHeaderProps {
  name: string;
  species: string | null;
  imageUri: string | null;
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
  onWater: () => void;
  onFertilize: () => void;
}

/**
 * Sticky plant page header: cover photo, name, species, one-tap care actions
 * with absolute last-care dates (detail context, so absolute per the spec).
 */
export function PlantHeader({
  name,
  species,
  imageUri,
  lastWateredAt,
  lastFertilizedAt,
  onWater,
  onFertilize,
}: PlantHeaderProps) {
  const { colors, spacing, radius, typography } = useTheme();
  const initial = (species ?? name).trim().charAt(0).toUpperCase();

  return (
    <View style={{ gap: spacing.md, padding: spacing.md }}>
      <View
        accessibilityElementsHidden={imageUri ? undefined : true}
        importantForAccessibility={imageUri ? 'auto' : 'no-hide-descendants'}
        style={{
          height: 180,
          borderRadius: radius.md,
          backgroundColor: colors.skeleton,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <Text
            accessibilityRole="text"
            style={[typography.heading, { color: colors.textMuted }]}
          >
            {initial}
          </Text>
        )}
      </View>
      <View style={{ gap: 2 }}>
        <Text accessibilityRole="header" style={[typography.heading, { color: colors.text }]}>
          {name}
        </Text>
        {species ? (
          <Text style={[typography.body, { color: colors.textMuted }]}>{species}</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <CareButton kind="water" lastAt={lastWateredAt} onPress={onWater} />
        </View>
        <View style={{ flex: 1 }}>
          <CareButton kind="fertilize" lastAt={lastFertilizedAt} onPress={onFertilize} />
        </View>
      </View>
      <Text
        accessibilityLabel={`Last watered ${formatDate(lastWateredAt)}, last fed ${formatDate(lastFertilizedAt)}`}
        style={[typography.caption, { color: colors.textMuted }]}
      >
        last watered {formatDate(lastWateredAt)} · last fed {formatDate(lastFertilizedAt)}
      </Text>
    </View>
  );
}
