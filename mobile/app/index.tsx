import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';

// Single routing decision at launch: signed-out users see sign-in, signed-in
// users land on the garden. Ongoing transitions are handled by the group gates.
export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    // The native splash still covers the screen.
    return null;
  }

  return <Redirect href={status === 'signedIn' ? '/(app)/garden' : '/(auth)/sign-in'} />;
}
