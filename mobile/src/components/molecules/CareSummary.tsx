import { Text, View } from 'react-native';

import { useTheme } from '@/theme';
import type { CareProfile } from '@plant-papa/schemas';

function formatTempRange(care: CareProfile): string | null {
  if (care.tempMin === null && care.tempMax === null) return null;
  if (care.tempMin !== null && care.tempMax !== null) return `${care.tempMin}–${care.tempMax} °C`;
  if (care.tempMin !== null) return `above ${care.tempMin} °C`;
  return `below ${care.tempMax} °C`;
}

/**
 * Care preview rendered strictly from the cached CareProfile — Trefle reports
 * no watering/fertilizing cadence, so those lines appear only when present
 * and are never invented.
 */
export function CareSummary({ care }: { care: CareProfile | null }) {
  const { colors, spacing, typography } = useTheme();

  if (!care) return null;

  const lines: string[] = [];
  const temp = formatTempRange(care);
  if (temp) lines.push(`Temp ${temp}`);
  if (care.watering) lines.push(care.watering);
  if (care.fertilizing) lines.push(care.fertilizing);

  if (lines.length === 0) {
    return (
      <Text style={[typography.caption, { color: colors.textMuted }]}>
        No care data available for this species yet.
      </Text>
    );
  }

  return (
    <View style={{ gap: spacing.xs }}>
      {lines.map((line) => (
        <Text key={line} style={[typography.body, { color: colors.textMuted }]}>
          {line}
        </Text>
      ))}
    </View>
  );
}
