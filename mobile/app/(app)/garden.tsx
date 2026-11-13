import * as Haptics from 'expo-haptics';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { GardenTemplate } from '@/components/templates/GardenTemplate';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';
import { PlantCard } from '@/components/organisms/PlantCard';
import { Button } from '@/components/atoms/Button';
import { useAuthUid } from '@/hooks/useAuthUid';
import { useGarden } from '@/hooks/useGarden';
import { needsWater } from '@/lib/care';
import type { CareType } from '@/services/garden';

/** Splits plants into fixed-size rows for the two-column garden grid. */
function chunkRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

function gardenSubtitle(count: number, thirsty: number): string | null {
  if (count === 0) return null;
  const plants = `${count} plant${count === 1 ? '' : 's'}`;
  const water = thirsty === 0 ? null : ` · ${thirsty} need${thirsty === 1 ? 's' : ''} water`;
  return `${plants}${water ?? ''}`;
}

export default function Garden() {
  const uid = useAuthUid();
  const garden = useGarden(uid);
  const { colors, spacing, typography } = useTheme();

  const thirsty = garden.plants.filter((plant) => needsWater(plant.lastWateredAt)).length;
  const subtitle = gardenSubtitle(garden.plants.length, thirsty);

  // The haptic tick is cosmetic; a device without haptics support must not
  // turn a care press into an error path.
  const handleCare = (plantId: string, type: CareType) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    void garden.logCare(plantId, type);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <GardenTemplate
        header={
          <View style={{ gap: 2 }}>
            <Text style={[typography.heading, { color: colors.text }]}>My Garden</Text>
            {subtitle ? (
              <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text>
            ) : null}
          </View>
        }
        floatingAction={
          <View style={{ position: 'absolute', bottom: spacing.lg, right: spacing.lg }}>
            <Button
              label="+"
              onPress={() => router.push('/add-plant')}
              style={{ minWidth: 56, borderRadius: 999 }}
            />
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
      >
        {garden.loading ? (
          <SkeletonList count={6} />
        ) : garden.error ? (
          <ErrorState message={garden.error} onRetry={garden.retry} />
        ) : uid === null ? (
          <EmptyState
            title="You are signed out"
            message="Sign in to see your garden and track plant care."
          />
        ) : garden.plants.length === 0 ? (
          <EmptyState
            title="Add your first plant"
            message="Identify by photo or search by name. Care tracking starts with your first plant."
            actionLabel="Add a plant"
            onAction={() => router.push('/add-plant')}
          />
        ) : (
          <>
            {garden.careError ? (
              <Text
                accessibilityRole="alert"
                style={[
                  typography.caption,
                  { color: colors.danger, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
                ]}
              >
                {garden.careError}
              </Text>
            ) : null}
            {chunkRows(garden.plants, 2).map((row, rowIndex) => (
              <View
                key={row[0]?.id ?? rowIndex}
                style={{
                  flexDirection: 'row',
                  gap: spacing.md,
                  paddingHorizontal: spacing.md,
                  marginBottom: spacing.md,
                }}
              >
                {row.map((plant) => (
                  <View key={plant.id} style={{ flex: 1 }}>
                    <PlantCard
                      name={plant.name}
                      species={plant.species}
                      imageUri={garden.imageUris[plant.id]}
                      lastWateredAt={plant.lastWateredAt}
                      lastFertilizedAt={plant.lastFertilizedAt}
                      onWater={() => handleCare(plant.id, 'water')}
                      onFertilize={() => handleCare(plant.id, 'fertilize')}
                    />
                  </View>
                ))}
                {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
              </View>
            ))}
          </>
        )}
      </GardenTemplate>
    </SafeAreaView>
  );
}
