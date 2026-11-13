import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { EmptyState } from '@/components/organisms/EmptyState';

// Placeholder: profile and username onboarding arrive with the auth subtask.
export default function Profile() {
  const { colors, typography } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <EmptyState
        title="Profile"
        message="Profile and username onboarding arrive with the auth milestone."
      />
      <Link href="/(dev)/stories" asChild>
        <Text
          style={[typography.caption, { color: colors.primary, textAlign: 'center', padding: 16 }]}
        >
          Component stories (dev)
        </Text>
      </Link>
    </SafeAreaView>
  );
}
