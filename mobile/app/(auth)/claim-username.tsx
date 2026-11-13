import { useState } from 'react';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { functions } from '@/services/firebase';
import { claimUsername } from '@/services/username';

// First-run onboarding: every account claims a unique username before the
// garden. The server (claimUsername) enforces format, reserved names, and
// case-insensitive uniqueness — the client surfaces its typed outcomes.
export default function ClaimUsername() {
  const { colors, typography } = useTheme();
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await claimUsername(functions, username.trim());
      if (result.ok) {
        // The profile snapshot flips auth status to ready; the (auth) gate
        // routes to the garden.
        return;
      }
      setError(result.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthTemplate
      title={<Text style={[typography.heading, { color: colors.text }]}>Pick your username</Text>}
    >
      <Text style={[typography.body, { color: colors.textMuted }]}>
        This is how friends find you on Plant Papa. You can change it later.
      </Text>
      <Input
        label="Username"
        value={username}
        onChangeText={(next) => setUsername(next.replace(/\s/g, ''))}
        autoCapitalize="none"
        autoComplete="username"
        autoCorrect={false}
        onSubmitEditing={handleSubmit}
      />
      {error ? (
        <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
      <Button
        label="Claim username"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!username.trim()}
      />
    </AuthTemplate>
  );
}
