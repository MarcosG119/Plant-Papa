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
  const initial = (species ?? name).trim().charAt(0).toUpperCase();

  // RN-Web hydration-safety: the card pressable and the care pressables must
  // not nest — a <button> cannot contain a <button>. The wrapper View carries
  // the card chrome; the identity block and the care row are sibling
  // pressables, so each keeps a real button element (native Enter/Space and
  // screen-reader roles) without nesting.
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.sm,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onPress ? `${name}, ${species ?? ''}. Open plant page.` : name}
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [
          { gap: spacing.sm },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View
          accessibilityElementsHidden={imageUri ? undefined : true}
          style={{
            height: 110,
            borderRadius: radius.sm,
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
              style={[typography.heading as TextStyle, { color: colors.textMuted }]}
            >
              {initial}
            </Text>
          )}
        </View>
        <View style={{ gap: 2 }}>
          <Text style={[typography.subheading as TextStyle, { color: colors.text }]}>{name}</Text>
          {species ? (
            <Text style={[typography.caption as TextStyle, { color: colors.textMuted }]}>{species}</Text>
          ) : null}
        </View>
        <Tag text={needsWater(lastWateredAt) ? 'needs water' : 'happy'} />
        <CareDateRow label="last watered" at={lastWateredAt} />
        <CareDateRow label="last fed" at={lastFertilizedAt} />
      </Pressable>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <CareButton kind="water" lastAt={lastWateredAt} onPress={onWater} />
        </View>
        <View style={{ flex: 1 }}>
          <CareButton kind="fertilize" lastAt={lastFertilizedAt} onPress={onFertilize} />
        </View>
      </View>
    </View>
  );
}
