import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/hooks/useAuth';

// Runs before the first paint; the splash stays up until auth state resolves.
// A failure to control it is user-visible, so surface it instead of swallowing.
void SplashScreen.preventAutoHideAsync().catch((error: unknown) => {
  console.warn('Splash control failed', error);
});

// Holds the native splash until auth state (and the username gate) resolves,
// so the index gate renders behind a covered screen instead of a flash.
function SplashGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync().catch((error: unknown) => {
        console.warn('Splash hide failed', error);
      });
    }
  }, [status]);

  return <>{children}</>;
}

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <AuthProvider>
      <SplashGate>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(dev)" />
          {/* Pushed detail screens live at the root Stack: a hidden Tabs
              child (href: null) makes router.push dead on web. */}
          <Stack.Screen name="plant/[id]" />
        </Stack>
      </SplashGate>
    </AuthProvider>
  );
}
