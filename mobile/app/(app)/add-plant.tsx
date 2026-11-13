import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { AddPlantTemplate } from '@/components/templates/AddPlantTemplate';
import { ConfirmPlant } from '@/components/organisms/ConfirmPlant';
import { PlantSearchList } from '@/components/organisms/PlantSearchList';
import { describeSearchError, usePlantSearch } from '@/hooks/usePlantSearch';
import { createPlant, getPlantDetails, type CreatePlantDraft } from '@/services/plants';

type Step =
  | { kind: 'choose' }
  | { kind: 'search' }
  | { kind: 'confirm'; draft: CreatePlantDraft; detailsError: string | null };

const STEP_TITLES: Record<Step['kind'], string> = {
  choose: 'Add a plant',
  search: 'Search by name',
  confirm: 'Confirm your plant',
};

/**
 * Add-plant flow: pick a discovery path, land on one confirm screen that
 * creates the plant. Trefle is contacted only along the way here — the
 * resulting document carries the care block, and opening the plant later
 * never calls Trefle again.
 */
export default function AddPlant() {
  const { colors, spacing, radius, typography } = useTheme();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [query, setQuery] = useState('');
  const search = usePlantSearch(step.kind === 'search' ? query : '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const back = () => {
    if (step.kind === 'choose') {
      router.back();
    } else if (step.kind === 'search') {
      setStep({ kind: 'choose' });
    } else {
      setStep({ kind: 'search' });
    }
  };

  const pickSearchResult = async (trefleId: number) => {
    const summary = search.results.find((r) => r.trefleId === trefleId);
    if (!summary) return;
    const draft: CreatePlantDraft = {
      name: summary.commonName ?? summary.scientificName,
      species: summary.scientificName || null,
      trefleId: summary.trefleId,
      mainImage: summary.imageUrl,
      care: null,
    };
    setStep({ kind: 'confirm', draft, detailsError: null });
    // Cache-at-save: this is the one Trefle detail call for the plant.
    try {
      const details = await getPlantDetails(trefleId);
      setStep((prev) =>
        prev.kind === 'confirm' && prev.draft.trefleId === trefleId
          ? { kind: 'confirm', draft: { ...prev.draft, care: details.care }, detailsError: null }
          : prev,
      );
    } catch {
      setStep((prev) =>
        prev.kind === 'confirm' && prev.draft.trefleId === trefleId
          ? {
              kind: 'confirm',
              draft: prev.draft,
              detailsError: 'Care data is unavailable right now. You can refresh it later from the plant page.',
            }
          : prev,
      );
    }
  };

  const confirm = async () => {
    if (step.kind !== 'confirm' || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createPlant(step.draft);
      // The garden's onSnapshot picks the new plant up without a refresh.
      router.back();
    } catch (err: unknown) {
      setSaving(false);
      setSaveError(describeSearchError(err));
    }
  };

  const title = STEP_TITLES[step.kind];

  return (
    <AddPlantTemplate
      header={
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={back}
            hitSlop={12}
            style={({ pressed }) => [pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </Pressable>
          <Text style={[typography.subheading, { color: colors.text }]}>{title}</Text>
        </View>
      }
    >
      {step.kind === 'choose' ? (
        <View style={[styles.chooseBody, { gap: spacing.md, paddingHorizontal: spacing.md }]}>
          <Button
            label="Search by name"
            variant="secondary"
            onPress={() => setStep({ kind: 'search' })}
          />
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
            Know the species already? Search its name and we&apos;ll fill in the care instructions.
          </Text>
        </View>
      ) : null}

      {step.kind === 'search' ? (
        <View style={[styles.searchBody, { paddingHorizontal: spacing.md }]}>
          <Input
            label="Plant name"
            value={query}
            onChangeText={setQuery}
            placeholder='e.g. "monstera"'
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            autoFocus
          />
          <PlantSearchList search={search} onPick={pickSearchResult} />
        </View>
      ) : null}

      {step.kind === 'confirm' ? (
        <View style={{ paddingHorizontal: spacing.md }}>
          {step.detailsError ? (
            <Text
              accessibilityRole="alert"
              style={[typography.caption, { color: colors.warning, marginBottom: spacing.sm }]}
            >
              {step.detailsError}
            </Text>
          ) : null}
          <ConfirmPlant
            draft={step.draft}
            onNameChange={(name) =>
              setStep((prev) =>
                prev.kind === 'confirm'
                  ? { ...prev, draft: { ...prev.draft, name } }
                  : prev,
              )
            }
            onConfirm={confirm}
            saving={saving}
            error={saveError}
            style={{ paddingHorizontal: 0 }}
          />
        </View>
      ) : null}
    </AddPlantTemplate>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chooseBody: {
    paddingTop: 32,
  },
  searchBody: {
    gap: 8,
  },
});
