import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { SpeciesRow } from '@/components/molecules/SpeciesRow';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';
import type { PlantSearchState } from '@/hooks/usePlantSearch';

export interface PlantSearchListProps {
  search: PlantSearchState;
  onPick: (trefleId: number) => void;
}

/** The shared list states over search results. Idle (query too short) renders nothing. */
export function PlantSearchList({ search, onPick }: PlantSearchListProps) {
  const { colors, radius, spacing, typography } = useTheme();

  if (search.status === 'idle') return null;

  if (search.status === 'loading') {
    return <SkeletonList count={5} />;
  }

  if (search.status === 'error') {
    return <ErrorState message={search.error ?? 'Something went wrong.'} onRetry={search.retry} />;
  }

  if (search.status === 'empty') {
    return (
      <EmptyState
        title="No matches"
        message="Try another name, or add the plant without identifying it."
      />
    );
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      testID="plant-search-list"
    >
      {search.results.map((result) => (
        <SpeciesRow
          key={result.trefleId}
          title={result.commonName ?? result.scientificName}
          subtitle={result.commonName ? result.scientificName : result.familyCommonName}
          imageUrl={result.imageUrl}
          onPress={() => onPick(result.trefleId)}
        />
      ))}
      <View
        style={[styles.notice, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md }]}
      >
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Not the plant you meant? Try the full botanical name, e.g. Monstera adansonii.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
    paddingBottom: 24,
  },
  notice: {
    marginTop: 8,
  },
});
