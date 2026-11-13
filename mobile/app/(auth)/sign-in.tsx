import { useCallback, useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { describeAuthError } from '@/lib/authErrors';
import { auth } from '@/services/firebase';
import { signInWithEmail, signInWithGoogleIdToken } from '@/services/auth';

type Submitting = 'email' | 'google' | null;

export default function SignIn() {
  const { colors, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState<Submitting>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = useCallback(
    async (idToken: string) => {
      setSubmitting('google');
      setError(null);
      try {
        await signInWithGoogleIdToken(auth, idToken);
        // Auth state flips; the (auth) gate routes to the garden.
      } catch (authError) {
        setError(describeAuthError(authError));
      } finally {
        setSubmitting(null);
      }
    },
    [],
  );
  const google = useGoogleSignIn(handleGoogleSuccess);

  const handleEmailSignIn = async () => {
    setSubmitting('email');
    setError(null);
    try {
      await signInWithEmail(auth, email.trim(), password);
    } catch (authError) {
      setError(describeAuthError(authError));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <AuthTemplate
      title={<Text style={[typography.heading, { color: colors.text }]}>Sign in to Plant Papa</Text>}
      footer={
        <Link href="/(auth)/sign-up" asChild>
          <Text style={[typography.body, { color: colors.primary }]}>
            Don&apos;t have an account? Sign up
          </Text>
        </Link>
      }
    >
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        onSubmitEditing={handleEmailSignIn}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button
        label="Sign in"
        onPress={handleEmailSignIn}
        loading={submitting === 'email'}
        disabled={!email.trim() || !password}
      />
      <Link href="/(auth)/forgot-password" asChild>
        <Text style={[typography.caption, { color: colors.textMuted }]}>Forgot password?</Text>
      </Link>
      {google.configured ? (
        <Button
          label="Continue with Google"
          variant="secondary"
          onPress={google.prompt}
          loading={submitting === 'google'}
        />
      ) : null}
    </AuthTemplate>
  );
}
