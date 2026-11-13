import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';
import { GardenTemplate } from '@/components/templates/GardenTemplate';
import { EmptyState } from '@/components/organisms/EmptyState';
import { Button } from '@/components/atoms/Button';

// Placeholder garden: the grid and add-plant flow arrive in their own subtasks.
export default function Garden() {
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <GardenTemplate
        header={
          <Text style={[typography.heading, { color: colors.text }]}>My Garden</Text>
        }
        floatingAction={
          <View style={{ position: 'absolute', bottom: spacing.lg, right: spacing.lg }}>
            <Button label="+" disabled style={{ minWidth: 56, borderRadius: 999 }} />
          </View>
        }
      >
        <EmptyState
          title="Add your first plant"
          message="Identify by photo or search by name. Care tracking starts with your first plant."
          actionLabel="Add a plant"
        />
      </GardenTemplate>
    </SafeAreaView>
  );
}
