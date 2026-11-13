import { useEffect } from 'react';
import { router, Stack, usePathname } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

// Auth-group gate: signed-in users never see auth screens, and users who still
// owe a username are pushed to onboarding — routing follows auth state, so
// screens never navigate on success themselves.
export default function AuthLayout() {
  const { status } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'ready') {
      router.replace('/(app)/garden');
      return;
    }
    // The pathname check keeps the claim screen from redirecting to itself;
    // it tolerates both pathname spellings (with and without the group).
    if (status === 'needsUsername' && !pathname?.includes('claim-username')) {
      router.replace('/(auth)/claim-username');
    }
  }, [status, pathname]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
