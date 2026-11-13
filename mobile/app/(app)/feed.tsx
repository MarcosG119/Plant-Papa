import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { EmptyState } from '@/components/organisms/EmptyState';

// Placeholder: the feed arrives with the social layer (spec part 2).
export default function Feed() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <EmptyState
        title="Feed"
        message="Friends' plant updates arrive with the social layer."
      />
    </SafeAreaView>
  );
}
