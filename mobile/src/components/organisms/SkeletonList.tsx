import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface SkeletonListProps {
  /** Number of skeleton rows to render. */
  count?: number;
  style?: StyleProp<ViewStyle>;
}

/** Shared loading state: quiet placeholder rows, no ad-hoc spinners. */
export function SkeletonList({ count = 3, style }: SkeletonListProps) {
  const { colors, spacing, radius } = useTheme();

  return (
    <View
      accessibilityLabel="Loading"
      style={[{ gap: spacing.md, padding: spacing.md }, style]}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            height: 96,
            borderRadius: radius.md,
            backgroundColor: colors.skeleton,
            opacity: 0.8,
          }}
        />
      ))}
    </View>
  );
}
