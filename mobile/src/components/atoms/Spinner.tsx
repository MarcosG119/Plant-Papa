import { ActivityIndicator } from 'react-native';

import { useTheme } from '@/theme';

export interface SpinnerProps {
  size?: 'small' | 'large';
  color?: string;
}

export function Spinner({ size = 'small', color }: SpinnerProps) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={color ?? colors.primary} />;
}
