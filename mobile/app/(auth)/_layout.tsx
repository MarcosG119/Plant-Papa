import { useEffect } from 'react';
import { router, Stack } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

// Auth-group gate: once a user is signed in, auth screens are never shown —
// routing follows auth state, so screens never navigate on success themselves.
export default function AuthLayout() {
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'signedIn') {
      router.replace('/(app)/garden');
    }
  }, [status]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
