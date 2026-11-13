import { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { AddPlantTemplate } from '@/components/templates/AddPlantTemplate';
import { ConfirmPlant } from '@/components/organisms/ConfirmPlant';
import { PlantSearchList } from '@/components/organisms/PlantSearchList';
import { SpeciesRow } from '@/components/molecules/SpeciesRow';
import { ErrorState } from '@/components/organisms/ErrorState';
import { describeSearchError, usePlantSearch } from '@/hooks/usePlantSearch';
import { prepareIdentifyImage } from '@/lib/identifyImage';
import {
  createPlant,
  getPlantDetails,
  identifyPlant,
  requireUid,
  type CreatePlantDraft,
  type IdentifiedCandidate,
} from '@/services/plants';
import {
  setPlantCover,
  uploadSavedPlantCover,
} from '@/services/photos';
import * as ImagePicker from 'expo-image-picker';

type Step =
  | { kind: 'choose' }
  | { kind: 'search' }
  | {
      kind: 'identify';
      /** Local uri for the preview; bytes go in the identify request. */
      localUri: string;
      /** Monotonic token guarding against stale identify results. */
      requestId: number;
      /** Cache uri of the compressed image once prepared; source for the save-time upload. */
      preparedUri: string | null;
      candidates: IdentifiedCandidate[] | null;
      error: string | null;
    }
  | { kind: 'confirm'; draft: CreatePlantDraft; localImageUri: string | null; detailsError: string | null };

const STEP_TITLES: Record<Step['kind'], string> = {
  choose: 'Add a plant',
  search: 'Search by name',
  identify: 'Identify from photo',
  confirm: 'Confirm your plant',
};

const CARE_UNAVAILABLE =
  'Care data is unavailable right now. You can refresh it later from the plant page.';

/**
 * Add-plant flow: pick a discovery path, land on one confirm screen that
 * creates the plant. Trefle is contacted only along the way here — the
 * resulting document carries the care block, and opening the plant later
 * never calls Trefle again.
 */
export default function AddPlant() {
  const { colors, spacing, typography } = useTheme();
  const [step, setStep] = useState<Step>({ kind: 'choose' });
  const [query, setQuery] = useState('');
  const search = usePlantSearch(step.kind === 'search' ? query : '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const identifySeq = useRef(0);

  const back = () => {
    if (step.kind === 'choose') {
      router.back();
    } else if (step.kind === 'search') {
      setStep({ kind: 'choose' });
    } else {
      setStep({ kind: 'choose' });
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
    setStep({ kind: 'confirm', draft, localImageUri: null, detailsError: null });
    // Cache-at-save: this is the one Trefle detail call for the plant.
    try {
      const details = await getPlantDetails(trefleId);
      setStep((prev) =>
        prev.kind === 'confirm' && prev.draft.trefleId === trefleId
          ? { kind: 'confirm', draft: { ...prev.draft, care: details.care }, localImageUri: prev.localImageUri, detailsError: null }
          : prev,
      );
    } catch {
      setStep((prev) =>
        prev.kind === 'confirm' && prev.draft.trefleId === trefleId
          ? { kind: 'confirm', draft: prev.draft, localImageUri: prev.localImageUri, detailsError: CARE_UNAVAILABLE }
          : prev,
      );
    }
  };

  /** Camera or library → base64 in the request → PlantNet → candidates.
    * Nothing touches Storage until the plant is saved. */
  const identifyFromPhoto = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setStep({
        kind: 'identify',
        localUri: '',
        requestId: ++identifySeq.current,
        preparedUri: null,
        candidates: null,
        error:
          source === 'camera'
            ? 'Camera access is needed to take a photo. Enable it in Settings and try again.'
            : 'Photo library access is needed. Enable it in Settings and try again.',
      });
      return;
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
          });
    if (result.canceled || result.assets.length === 0) return;
    const localUri = result.assets[0].uri;
    const requestId = ++identifySeq.current;
    setStep({ kind: 'identify', localUri, requestId, preparedUri: null, candidates: null, error: null });
    try {
      // Bytes, not uploads: the compressed base64 rides in the callable
      // request and plantnetIdentify forwards it to PlantNet directly.
      const prepared = await prepareIdentifyImage(localUri);
      if (identifySeq.current !== requestId) return; // a newer attempt owns the step
      setStep((prev) =>
        prev.kind === 'identify' && prev.requestId === requestId
          ? { ...prev, preparedUri: prepared.uri }
          : prev,
      );
      const candidates = await identifyPlant(`data:image/jpeg;base64,${prepared.base64}`);
      if (identifySeq.current !== requestId) return; // a newer attempt owns the step
      setStep((prev) =>
        prev.kind === 'identify' && prev.requestId === requestId
          ? { ...prev, candidates }
          : prev,
      );
    } catch (err: unknown) {
      if (identifySeq.current !== requestId) return;
      setStep((prev) =>
        prev.kind === 'identify' && prev.requestId === requestId
          ? { ...prev, error: describeIdentifyError(err) }
          : prev,
      );
    }
  };

  const pickCandidate = (candidate: IdentifiedCandidate) => {
    if (step.kind !== 'identify' || step.candidates === null) return;
    setStep({
      kind: 'confirm',
      draft: {
        name: candidate.commonName ?? candidate.scientificName,
        species: candidate.scientificName,
        trefleId: candidate.trefleId,
        // The photo is attached to the doc only after save (the upload
        // needs the plantId); the preview keeps showing the local image.
        mainImage: null,
        care: candidate.care,
      },
      // The compressed cache image doubles as the preview and the
      // save-time upload source.
      localImageUri: step.preparedUri ?? step.localUri,
      detailsError: candidate.care === null ? CARE_UNAVAILABLE : null,
    });
  };

  const confirm = async () => {
    if (step.kind !== 'confirm' || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const plantId = await createPlant(step.draft);
      // Photo storage happens now — and only now, per the no-pre-save-storage
      // rule — under the same users/{uid}/plants/{plantId}/ objects tree the
      // gallery uses. The plant is already saved, so a cover upload failure
      // (or a failed cover update) must not fail the save or trigger a
      // duplicate on retry: the plant renders without a cover instead.
      if (step.localImageUri) {
        const uid = requireUid();
        const gsUrl = await uploadSavedPlantCover(uid, plantId, step.localImageUri);
        if (gsUrl) {
          try {
            await setPlantCover(uid, plantId, gsUrl);
          } catch (coverError: unknown) {
            console.warn(`Failed to set cover for plant ${plantId}:`, coverError);
          }
        }
      }
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
          <Button label="Take a photo" variant="secondary" onPress={() => identifyFromPhoto('camera')} />
          <Button
            label="Choose from library"
            variant="secondary"
            onPress={() => identifyFromPhoto('library')}
          />
          <Button label="Search by name" variant="secondary" onPress={() => setStep({ kind: 'search' })} />
          <Button label="Add without identifying" variant="ghost" onPress={() => setStep({ kind: 'confirm', draft: { name: '', species: null, trefleId: null, mainImage: null, care: null }, localImageUri: null, detailsError: null })} />
          <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
            Snap a leaf and we&apos;ll identify the species, or search its name.
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

      {step.kind === 'identify' ? (
        <View style={[styles.searchBody, { paddingHorizontal: spacing.md, gap: spacing.md }]}>
          {step.localUri ? (
            <Image
              source={{ uri: step.localUri }}
              accessibilityLabel="Your photo"
              style={[styles.photo, { borderRadius: 12, backgroundColor: colors.skeleton }]}
            />
          ) : null}
          {step.error ? (
            <ErrorState message={step.error} onRetry={() => setStep({ kind: 'choose' })} />
          ) : null}
          {!step.error && step.candidates === null ? (
            <Text style={[typography.body, { color: colors.textMuted }]}>
              Identifying your photo…
            </Text>
          ) : null}
          {step.candidates !== null && step.candidates.length === 0 ? (
            <ErrorState message="We couldn't confidently identify this photo." />
          ) : null}
          {step.candidates !== null && step.candidates.length > 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={[typography.caption, { color: colors.textMuted }]}>
                Best matches, most confident first:
              </Text>
              {step.candidates.map((candidate, index) => (
                <SpeciesRow
                  key={`${candidate.scientificName}-${index}`}
                  title={candidate.commonName ?? candidate.scientificName}
                  subtitle={candidate.commonName ? candidate.scientificName : candidate.family}
                  badge={`${Math.round(candidate.score * 100)}%`}
                  imageUrl={candidate.imageUrl}
                  onPress={() => pickCandidate(candidate)}
                />
              ))}
            </View>
          ) : null}
          {step.candidates !== null ? (
            <Button label="None of these — search by name" variant="ghost" onPress={() => setStep({ kind: 'search' })} />
          ) : null}
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
            localImageUri={step.localImageUri}
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

function describeIdentifyError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (message.startsWith('auth/')) {
    return 'You are signed out. Sign in again to identify plants.';
  }
  return "Identification failed. Check your connection, or search the plant's name instead.";
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
  photo: {
    width: '100%',
    aspectRatio: 1.6,
  },
});
