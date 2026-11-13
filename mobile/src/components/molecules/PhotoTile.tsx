import { Image, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface PhotoTileProps {
  uri: string;
  onPress?: () => void;
  /** Accessible description of the photo. */
  caption?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Gallery grid cell: a square photo that opens the viewer upstream. */
export function PhotoTile({ uri, onPress, caption, size, style }: PhotoTileProps) {
  const { radius } = useTheme();

  const image = (
    <Image
      source={{ uri }}
      resizeMode="cover"
      style={{
        width: '100%',
        aspectRatio: 1,
        borderRadius: radius.sm,
        backgroundColor: 'transparent',
      }}
    />
  );

  if (!onPress) {
    return <View style={[size ? { width: size } : null, style]}>{image}</View>;
  }

  return (
    <Pressable
      accessibilityRole="imagebutton"
      accessibilityLabel={caption ?? 'Plant photo'}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, size ? { width: size } : null, style]}
    >
      {image}
    </Pressable>
  );
}
