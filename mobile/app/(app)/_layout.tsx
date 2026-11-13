import { useEffect } from 'react';
import { router, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/theme';

// Feed is a placeholder for the social layer (spec part 2).
// Navigation resolves the tab tint to a string color; ColorValue's number/null members never appear here.
const iconColor = (color: ColorValue): string => color as string;

export default function AppLayout() {
  const { colors } = useTheme();
  const { status } = useAuth();

  // Signed-out or username-less users never see app screens.
  useEffect(() => {
    if (status === 'signedOut') {
      router.replace('/(auth)/sign-in');
    }
    if (status === 'needsUsername') {
      router.replace('/(auth)/claim-username');
    }
  }, [status]);

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
      {/* add-plant and plant/[id] are pushed screens, not tab destinations. */}
      <Tabs.Screen name="add-plant" options={{ href: null }} />
      <Tabs.Screen name="plant/[id]" options={{ href: null }} />
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
