import { Image, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { CareSummary } from '@/components/molecules/CareSummary';
import { Input } from '@/components/atoms/Input';
import type { CreatePlantDraft } from '@/services/plants';

export interface ConfirmPlantProps {
  draft: CreatePlantDraft;
  /** Local camera/gallery uri to preview before the Storage copy exists. */
  localImageUri?: string | null;
  onNameChange: (name: string) => void;
  onConfirm: () => void;
  saving: boolean;
  error: string | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * The one confirm screen for every add path: species photo (or local preview),
 * editable name, species line, and the care profile that will be cached on
 * the plant document at save time.
 */
export function ConfirmPlant({
  draft,
  localImageUri,
  onNameChange,
  onConfirm,
  saving,
  error,
  style,
}: ConfirmPlantProps) {
  const { colors, radius, spacing, typography } = useTheme();
  const previewUri = localImageUri ?? draft.mainImage;

  return (
    <ScrollView contentContainerStyle={[styles.container, { padding: spacing.md, gap: spacing.md }, style]}>
      {previewUri ? (
        <Image
          source={{ uri: previewUri }}
          accessibilityLabel="Plant photo"
          style={[
            styles.photo,
            { backgroundColor: colors.skeleton, borderRadius: radius.md },
          ]}
        />
      ) : null}
      <Input
        label="Name"
        value={draft.name}
        onChangeText={onNameChange}
        placeholder="e.g. Monty"
        autoCapitalize="words"
        textContentType="nickname"
      />
      {draft.species ? (
        <Text style={[typography.body, { color: colors.textMuted }]}>{draft.species}</Text>
      ) : null}
      <View style={[styles.careBlock, { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}>
        <Text style={[typography.subheading, { color: colors.text }]}>Care</Text>
        <CareSummary care={draft.care} />
        {draft.care === null ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Care instructions can be refreshed from the plant page later.
          </Text>
        ) : null}
      </View>
      {error ? (
        <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button
        label={saving ? 'Adding…' : 'Add to My Garden'}
        onPress={onConfirm}
        disabled={saving || draft.name.trim().length === 0}
        loading={saving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
  },
  photo: {
    width: '100%',
    aspectRatio: 1.6,
  },
  careBlock: {},
});
