import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { CareSummary } from '@/components/molecules/CareSummary';
import { relativeTime } from '@/lib/relativeTime';
import type { CareLogEntry } from '@/services/plantPage';

const LOG_LABELS = {
  water: 'Watered',
  fertilize: 'Fed',
} as const;

export interface CareInstructionsCardProps {
  /** The plant's cached care block — this card never fetches Trefle itself. */
  care: CareInstructionsCare | null;
  /** Present only for Trefle-backed plants; the refresh re-pulls explicitly. */
  canRefresh: boolean;
  refreshing: boolean;
  refreshError: string | null;
  onRefresh: () => void;
  careLog: CareLogEntry[];
  style?: StyleProp<ViewStyle>;
}

type CareInstructionsCare = Parameters<typeof CareSummary>[0]['care'];

/**
 * Care instructions rendered strictly from the cached care block saved at add
 * time. The only Trefle path is the explicit "refresh instructions" tap, which
 * the parent wires to refreshPlantCare; the timeline beneath reads careLog.
 */
export function CareInstructionsCard({
  care,
  canRefresh,
  refreshing,
  refreshError,
  onRefresh,
  careLog,
  style,
}: CareInstructionsCardProps) {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.md,
          marginHorizontal: spacing.md,
          marginTop: spacing.md,
        },
        style,
      ]}
    >
      <Text style={[typography.subheading, { color: colors.text }]}>Care instructions</Text>
      <CareSummary care={care} />
      {canRefresh ? (
        <View style={{ gap: spacing.xs }}>
          <Button
            label="Refresh instructions"
            variant="secondary"
            loading={refreshing}
            onPress={onRefresh}
          />
          {refreshError ? (
            <Text
              accessibilityRole="alert"
              style={[typography.caption, { color: colors.danger }]}
            >
              {refreshError}
            </Text>
          ) : null}
        </View>
      ) : null}
      <View style={{ gap: spacing.xs }}>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Recent care</Text>
        {careLog.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            No care logged yet — tap Water or Feed above to start the history.
          </Text>
        ) : (
          careLog.map((entry) => (
            <Text
              key={entry.id}
              accessibilityLabel={`${LOG_LABELS[entry.type]} ${relativeTime(entry.at)}`}
              style={[typography.body, { color: colors.text }]}
            >
              {LOG_LABELS[entry.type]} · {relativeTime(entry.at)}
            </Text>
          ))
        )}
      </View>
    </View>
  );
}
