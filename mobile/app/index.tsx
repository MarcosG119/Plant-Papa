import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { ErrorState } from '@/components/organisms/ErrorState';

// Single routing decision at launch: signed-out users see sign-in, users who
// still owe a username see onboarding, everyone else lands on the garden.
// Ongoing transitions are handled by the group gates.
export default function Index() {
  const { status, retryProfile } = useAuth();

  if (status === 'loading') {
    // The native splash still covers the screen.
    return null;
  }

  if (status === 'error') {
    return <ErrorState message="Could not load your profile." onRetry={retryProfile} />;
  }

  const href =
    status === 'signedOut'
      ? '/(auth)/sign-in'
      : status === 'needsUsername'
        ? '/(auth)/claim-username'
        : '/(app)/garden';

  return <Redirect href={href} />;
}
