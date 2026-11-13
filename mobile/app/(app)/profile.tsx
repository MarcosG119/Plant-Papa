import { useState } from 'react';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { EmptyState } from '@/components/organisms/EmptyState';
import { useAuth } from '@/hooks/useAuth';
import { describeAuthError } from '@/lib/authErrors';
import { auth } from '@/services/firebase';
import { signOutUser } from '@/services/auth';

export default function Profile() {
  const { colors, typography, spacing } = useTheme();
  const { user, username } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOutUser(auth);
      // The (app) gate routes back to the (auth) group on the state change.
    } catch (authError) {
      setError(describeAuthError(authError));
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.md, padding: spacing.lg }}>
        <Text style={[typography.subheading, { color: colors.text, textAlign: 'center' }]}>
          {user?.email ?? 'Signed in'}
        </Text>
        <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
          {username ? `@${username}` : 'No username yet'}
        </Text>
        {error ? (
          <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Button label="Sign out" variant="secondary" onPress={handleSignOut} loading={signingOut} />
        <Link href="/(dev)/stories" asChild>
          <Text style={[typography.caption, { color: colors.primary, textAlign: 'center' }]}>
            Component stories (dev)
          </Text>
        </Link>
      </View>
      <EmptyState
        title="Profile"
        message="Profile editing arrives with the garden milestone."
      />
    </SafeAreaView>
  );
}
