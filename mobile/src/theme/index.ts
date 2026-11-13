import { useColorScheme } from 'react-native';

import { colors, spacing, radius, typography, minTouchTarget, type ThemeColors } from './tokens';

export * from './tokens';

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  minTouchTarget: number;
}

/** Single theme source: components never hardcode colors or spacing. */
export function useTheme(): Theme {
  const scheme = useColorScheme();
  return {
    colors: scheme === 'dark' ? colors.dark : colors.light,
    spacing,
    radius,
    typography,
    minTouchTarget,
  };
}
