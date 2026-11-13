import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { PlantDetailTab } from '@/components/templates/PlantDetailTemplate';

const TAB_LABELS: Record<PlantDetailTab, string> = {
  care: 'Care',
  notes: 'Notes',
  gallery: 'Gallery',
  chat: 'Chat',
};

export interface PlantTabBarProps {
  activeTab: PlantDetailTab;
  onSelectTab: (tab: PlantDetailTab) => void;
  style?: StyleProp<ViewStyle>;
}

/** The plant page's four-tab bar: Care / Notes / Gallery / Chat. */
export function PlantTabBar({ activeTab, onSelectTab, style }: PlantTabBarProps) {
  const { colors, spacing, radius, typography, minTouchTarget } = useTheme();
  const tabs = Object.keys(TAB_LABELS) as PlantDetailTab[];

  return (
    <View
      accessibilityRole="tablist"
      style={[
        {
          flexDirection: 'row',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.xs,
        },
        style,
      ]}
    >
      {tabs.map((tab) => {
        const active = tab === activeTab;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${TAB_LABELS[tab]} tab`}
            onPress={() => onSelectTab(tab)}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: minTouchTarget - spacing.xs,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.sm,
                backgroundColor: active ? colors.primary : 'transparent',
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                typography.button as TextStyle,
                { color: active ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {TAB_LABELS[tab]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
