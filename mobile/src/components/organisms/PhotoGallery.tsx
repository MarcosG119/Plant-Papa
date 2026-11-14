import { FlatList, Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { PhotoTile } from '@/components/molecules/PhotoTile';

export interface GalleryPhoto {
  id: string;
  uri: string;
  caption?: string | null;
  takenAt: Date;
}

export interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  /** Present once the uploader (camera/library) is wired; renders the add tile. */
  onAddPhoto?: () => void;
  onPressPhoto?: (photo: GalleryPhoto) => void;
  style?: StyleProp<ViewStyle>;
}

/** Photo grid ordered by date so growth reads top to bottom. */
export function PhotoGallery({ photos, onAddPhoto, onPressPhoto, style }: PhotoGalleryProps) {
  const { spacing, colors, radius, typography } = useTheme();

  const ordered = [...photos].sort((a, b) => b.takenAt.getTime() - a.takenAt.getTime());

  return (
    <FlatList
      data={ordered}
      keyExtractor={(photo) => photo.id}
      numColumns={3}
      columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
      renderItem={({ item }) => (
        <View style={{ flex: 1 }}>
          <PhotoTile uri={item.uri} caption={item.caption} onPress={() => onPressPhoto?.(item)} />
        </View>
      )}
      ListHeaderComponent={
        onAddPhoto ? (
          // Row wrapper with flex:1 spacers reproduces the photo grid's
          // three-column flex distribution (columnWrapperStyle), so the add
          // tile gets exactly one cell's width — a one-third square aligned
          // with the cells. Bare flex:1 + aspectRatio on a bare Pressable let
          // the tile stretch to the full container width on web, pushing the
          // photos below the fold.
          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              paddingHorizontal: spacing.md,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              onPress={onAddPhoto}
              style={({ pressed }) => [
                {
                  aspectRatio: 1,
                  borderRadius: radius.sm,
                  backgroundColor: colors.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[typography.heading as TextStyle, { color: colors.textMuted }]}>+</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <View style={{ flex: 1 }} />
          </View>
        ) : undefined
      }
      ListEmptyComponent={
        <Text style={[typography.body as TextStyle, { color: colors.textMuted, textAlign: 'center', padding: spacing.lg }]}>
          No photos yet
        </Text>
      }
      contentContainerStyle={[{ gap: spacing.sm, paddingVertical: spacing.md }, style]}
    />
  );
}
