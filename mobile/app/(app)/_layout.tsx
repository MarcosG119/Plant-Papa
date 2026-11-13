import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/theme';

// Feed is a placeholder for the social layer (spec part 2).
// Navigation resolves the tab tint to a string color; ColorValue's number/null members never appear here.
const iconColor = (color: ColorValue): string => color as string;

export default function AppLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface },
      }}
    >
      <Tabs.Screen
        name="garden"
        options={{
          title: 'Garden',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={iconColor(color)} />,
        }}
      />
      {/* add-plant is a pushed flow screen, not a tab destination. */}
      <Tabs.Screen name="add-plant" options={{ href: null }} />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={iconColor(color)} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={iconColor(color)} />,
        }}
      />
    </Tabs>
  );
}
