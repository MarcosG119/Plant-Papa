import { useState } from 'react';
import { Link } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { describeAuthError } from '@/lib/authErrors';
import { auth } from '@/services/firebase';
import { sendPasswordReset } from '@/services/auth';

export default function ForgotPassword() {
  const { colors, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await sendPasswordReset(auth, email.trim());
      setSentTo(email.trim());
    } catch (authError) {
      setError(describeAuthError(authError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthTemplate
      title={<Text style={[typography.heading, { color: colors.text }]}>Reset your password</Text>}
      footer={
        <Link href="/(auth)/sign-in" asChild>
          <Text style={[typography.body, { color: colors.primary }]}>Back to sign in</Text>
        </Link>
      }
    >
      {sentTo ? (
        <Text style={[typography.body, { color: colors.text }]}>
          Check your inbox — a reset link is on its way to {sentTo}.
        </Text>
      ) : (
        <>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onSubmitEditing={handleSend}
          />
          {error ? (
            <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
              {error}
            </Text>
          ) : null}
          <Button
            label="Send reset link"
            onPress={handleSend}
            loading={submitting}
            disabled={!email.trim()}
          />
        </>
      )}
    </AuthTemplate>
  );
}
