import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/theme';
import { CareButton } from '@/components/atoms/CareButton';
import { CareDateRow } from '@/components/molecules/CareDateRow';
import { Tag } from '@/components/atoms/Tag';
import { needsWater } from '@/lib/care';

export interface PlantCardProps {
  name: string;
  species?: string | null;
  imageUri?: string | null;
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
  onWater?: () => void;
  onFertilize?: () => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Garden grid card: identity, relative last-care dates, one-tap care actions. */
export function PlantCard({
  name,
  species,
  imageUri,
  lastWateredAt,
  lastFertilizedAt,
  onWater,
  onFertilize,
  onPress,
  style,
}: PlantCardProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={onPress ? `${name}, ${species ?? ''}. Open plant page.` : name}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {imageUri ? (
        <View
          style={{
            height: 110,
            borderRadius: radius.sm,
            backgroundColor: colors.skeleton,
            overflow: 'hidden',
          }}
        >
          <Image source={{ uri: imageUri }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        </View>
      ) : null}
      <View style={{ gap: 2 }}>
        <Text style={[typography.subheading as TextStyle, { color: colors.text }]}>{name}</Text>
        {species ? (
          <Text style={[typography.caption as TextStyle, { color: colors.textMuted }]}>{species}</Text>
        ) : null}
      </View>
      <Tag text={needsWater(lastWateredAt) ? 'needs water' : 'happy'} />
      <CareDateRow label="last watered" at={lastWateredAt} />
      <CareDateRow label="last fed" at={lastFertilizedAt} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <CareButton kind="water" lastAt={lastWateredAt} onPress={onWater} />
        </View>
        <View style={{ flex: 1 }}>
          <CareButton kind="fertilize" lastAt={lastFertilizedAt} onPress={onFertilize} />
        </View>
      </View>
    </Pressable>
  );
}
