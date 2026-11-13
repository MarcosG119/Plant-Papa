import { useCallback, useState } from 'react';
import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn';
import { describeAuthError } from '@/lib/authErrors';
import { auth } from '@/services/firebase';
import { createAccount, signInWithGoogleIdToken } from '@/services/auth';

type Submitting = 'email' | 'google' | null;

export default function SignUp() {
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
        // Auth state flips; the (auth) gate routes to username claiming or the garden.
      } catch (authError) {
        setError(describeAuthError(authError));
      } finally {
        setSubmitting(null);
      }
    },
    [],
  );
  const google = useGoogleSignIn(handleGoogleSuccess);

  const handleEmailSignUp = async () => {
    setSubmitting('email');
    setError(null);
    try {
      await createAccount(auth, email.trim(), password);
      // createUserWithEmailAndPassword already establishes the session — no
      // second sign-in call. The (auth) gate routes to username claiming.
    } catch (authError) {
      setError(describeAuthError(authError));
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <AuthTemplate
      title={<Text style={[typography.heading, { color: colors.text }]}>Create your account</Text>}
      footer={
        <Link href="/(auth)/sign-in" asChild>
          <Text style={StyleSheet.flatten([typography.body, { color: colors.primary }])}>
            Already have an account? Sign in
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
        autoComplete="new-password"
        onSubmitEditing={handleEmailSignUp}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button
        label="Create account"
        onPress={handleEmailSignUp}
        loading={submitting === 'email'}
        disabled={!email.trim() || !password}
      />
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
