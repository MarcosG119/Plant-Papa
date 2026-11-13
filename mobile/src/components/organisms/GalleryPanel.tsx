import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/theme';
import { PhotoGallery } from '@/components/organisms/PhotoGallery';
import { PhotoViewer } from '@/components/organisms/PhotoViewer';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';
import type { UsePlantPhotosResult } from '@/hooks/usePlantPhotos';

export interface GalleryPanelProps {
  gallery: UsePlantPhotosResult;
}

/**
 * The Gallery tab: "+" tile opens camera/library, uploads show visible
 * progress, and a tap opens the dated full-screen viewer. Photos are the
 * progress record, ordered newest first.
 */
export function GalleryPanel({ gallery }: GalleryPanelProps) {
  const { colors, spacing, typography } = useTheme();
  const [viewerStartIndex, setViewerStartIndex] = useState<number | null>(null);

  const pickAndUpload = async (useCamera: boolean) => {
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled || result.assets.length === 0) return;
    await gallery.upload(result.assets[0].uri);
  };

  const openPickerChoice = () => {
    // Cross-platform camera/library choice; the picker itself handles its
    // own permission prompts.
    Alert.alert('Add a photo', undefined, [
      { text: 'Take a photo', onPress: () => void pickAndUpload(true) },
      { text: 'Choose from library', onPress: () => void pickAndUpload(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  if (gallery.loading) return <SkeletonList count={3} />;
  if (gallery.error) return <ErrorState message={gallery.error} onRetry={gallery.retry} />;

  return (
    <View style={{ paddingBottom: spacing.md }}>
      {gallery.uploadError ? (
        <Text
          accessibilityRole="alert"
          style={[typography.caption, { color: colors.danger, paddingHorizontal: spacing.md }]}
        >
          {gallery.uploadError}
        </Text>
      ) : null}
      {gallery.coverError ? (
        <Text
          accessibilityRole="alert"
          style={[typography.caption, { color: colors.danger, paddingHorizontal: spacing.md }]}
        >
          {gallery.coverError}
        </Text>
      ) : null}
      {gallery.uploading ? (
        <Text
          accessibilityLabel={`Uploading photo, ${Math.round(gallery.progress * 100)} percent`}
          style={[typography.caption, { color: colors.textMuted, paddingHorizontal: spacing.md }]}
        >
          Uploading… {Math.round(gallery.progress * 100)}%
        </Text>
      ) : null}
      {gallery.photos.length === 0 && !gallery.uploading ? (
        <EmptyState
          title="No photos yet"
          message="Add photos over time to watch this plant grow."
          actionLabel="Add a photo"
          onAction={openPickerChoice}
        />
      ) : (
        <PhotoGallery
          photos={gallery.photos}
          onAddPhoto={openPickerChoice}
          onPressPhoto={(photo) =>
            setViewerStartIndex(gallery.photos.findIndex((p) => p.id === photo.id))
          }
        />
      )}
      {viewerStartIndex !== null ? (
        <PhotoViewer
          photos={gallery.photos}
          startIndex={viewerStartIndex}
          onClose={() => setViewerStartIndex(null)}
          onSetCover={(photo) => void gallery.setCover(photo)}
        />
      ) : null}
    </View>
  );
}
