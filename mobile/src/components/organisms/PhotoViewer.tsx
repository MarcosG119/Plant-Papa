import { useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { formatDate } from '@/lib/dates';
import type { GalleryPhotoView } from '@/hooks/usePlantPhotos';

export interface PhotoViewerProps {
  photos: GalleryPhotoView[];
  /** Index into `photos` of the photo the viewer opens on. */
  startIndex: number;
  onClose: () => void;
  onSetCover: (photo: GalleryPhotoView) => void;
}

/**
 * Full-screen photo viewer: swipeable pages with the photo's date ("photos
 * are the progress record"), set-as-cover for the photo on screen. Dates are
 * absolute here, per the spec's detail-context rule.
 */
export function PhotoViewer({ photos, startIndex, onClose, onSetCover }: PhotoViewerProps) {
  const { spacing, typography } = useTheme();
  const windowWidth = useWindowDimensions().width;
  const [index, setIndex] = useState(startIndex);
  const current = photos[index] ?? photos[startIndex];

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} accessibilityLabel="Photo viewer">
      <View style={styles.backdrop}>
        <FlatList
          data={photos}
          keyExtractor={(photo) => photo.id}
          horizontal
          pagingEnabled
          initialScrollIndex={startIndex}
          getItemLayout={(_, i) => ({ length: windowWidth, offset: windowWidth * i, index: i })}
          onMomentumScrollEnd={(event) =>
            setIndex(Math.round(event.nativeEvent.contentOffset.x / windowWidth))
          }
          renderItem={({ item }) => (
            <View style={{ width: windowWidth, alignItems: 'center', justifyContent: 'center' }}>
              {/* Contain keeps the whole photo visible over black. */}
              <Image
                source={{ uri: item.uri }}
                resizeMode="contain"
                style={{ width: windowWidth, height: '80%' }}
              />
              <Text
                accessibilityLabel={`Photo taken ${formatDate(item.takenAt)}`}
                style={[typography.caption, { color: '#ffffff', marginTop: spacing.md }]}
              >
                {formatDate(item.takenAt)}
              </Text>
            </View>
          )}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm }}>
          {current ? (
            <Button label="Set as cover" variant="secondary" onPress={() => onSetCover(current)} />
          ) : null}
          <View style={{ flex: 1 }} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close viewer"
            onPress={onClose}
            hitSlop={12}
          >
            <Ionicons name="close" size={32} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000' },
});
