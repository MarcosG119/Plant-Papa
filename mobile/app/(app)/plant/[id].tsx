import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { PlantDetailTemplate, type PlantDetailTab } from '@/components/templates/PlantDetailTemplate';
import { PlantHeader } from '@/components/organisms/PlantHeader';
import { PlantTabBar } from '@/components/organisms/PlantTabBar';
import { CareInstructionsCard } from '@/components/organisms/CareInstructionsCard';
import { NotesPanel } from '@/components/organisms/NotesPanel';
import { GalleryPanel } from '@/components/organisms/GalleryPanel';
import { ChatPanel } from '@/components/organisms/ChatPanel';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';
import { useAuthUid } from '@/hooks/useAuthUid';
import { usePlant } from '@/hooks/usePlant';
import { usePlantImageUri } from '@/hooks/usePlantImageUri';
import { useCareLog } from '@/hooks/useCareLog';
import { useNotes } from '@/hooks/useNotes';
import { usePlantPhotos } from '@/hooks/usePlantPhotos';
import { usePlantChat } from '@/hooks/usePlantChat';
import type { CareType } from '@/services/garden';

export default function PlantPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const plantId = typeof id === 'string' ? id : '';
  const uid = useAuthUid();
  const { colors, typography, spacing } = useTheme();
  const [activeTab, setActiveTab] = useState<PlantDetailTab>('care');

  const detail = usePlant(uid, plantId);
  const imageUri = usePlantImageUri(uid, plantId, detail.plant?.mainImage ?? null);
  const careLog = useCareLog(uid, plantId);
  const notes = useNotes(uid, plantId);
  const gallery = usePlantPhotos(uid, plantId);
  const chat = usePlantChat(uid, plantId);

  // The haptic tick is cosmetic; a device without haptics support must not
  // turn a care press into an error path.
  const handleCare = (type: CareType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    void detail.logCare(type);
  };

  const tabContent = () => {
    if (!detail.plant) return null;
    switch (activeTab) {
      case 'care':
        return (
          <CareInstructionsCard
            care={detail.plant.care}
            canRefresh={detail.plant.trefleId !== null}
            refreshing={detail.refreshingCare}
            refreshError={detail.careRefreshError}
            onRefresh={() => void detail.refreshCare()}
            careLog={careLog.entries}
          />
        );
      case 'notes':
        return (
          <NotesPanel
            notes={notes.notes}
            loading={notes.loading}
            error={notes.error}
            actionError={notes.actionError}
            onAdd={notes.add}
            onSave={notes.save}
            onRemove={notes.remove}
            onRetry={notes.retry}
          />
        );
      case 'gallery':
        return <GalleryPanel gallery={gallery} />;
      case 'chat':
        return <ChatPanel chat={chat} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <PlantDetailTemplate
        header={
          detail.loading ? (
            <SkeletonList count={1} />
          ) : detail.error ? (
            <ErrorState message={detail.error} onRetry={detail.retry} />
          ) : detail.missing || !detail.plant ? (
            <EmptyState
              title="Plant not found"
              message="It may have been removed."
              actionLabel="Back to My Garden"
              onAction={() => router.back()}
            />
          ) : (
            <>
              <PlantHeader
                name={detail.plant.name}
                species={detail.plant.species}
                imageUri={imageUri}
                lastWateredAt={detail.plant.lastWateredAt}
                lastFertilizedAt={detail.plant.lastFertilizedAt}
                onWater={() => handleCare('water')}
                onFertilize={() => handleCare('fertilize')}
              />
              {detail.careError ? (
                <Text
                  accessibilityRole="alert"
                  style={[
                    typography.caption,
                    {
                      color: colors.danger,
                      paddingHorizontal: spacing.md,
                      paddingBottom: spacing.sm,
                    },
                  ]}
                >
                  {detail.careError}
                </Text>
              ) : null}
            </>
          )
        }
        tabBar={<PlantTabBar activeTab={activeTab} onSelectTab={setActiveTab} />}
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {detail.loading ? (
          <SkeletonList count={2} />
        ) : detail.error ? (
          <ErrorState message={detail.error} onRetry={detail.retry} />
        ) : (
          tabContent()
        )}
      </PlantDetailTemplate>
    </SafeAreaView>
  );
}
