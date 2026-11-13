import { Link } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/atoms/Button';

// Placeholder screen: real sign-up arrives with the auth subtask.
export default function SignUp() {
  const { colors, typography } = useTheme();

  return (
    <AuthTemplate
      title={<Text style={[typography.heading, { color: colors.text }]}>Create your account</Text>}
    >
      <Button label="Create account" disabled />
      <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
        Sign-up and username claiming are wired in the auth milestone.
      </Text>
      <Link href="/(auth)/sign-in" asChild>
        <Text style={[typography.body, { color: colors.primary, textAlign: 'center' }]}>
          Already have an account? Sign in
        </Text>
      </Link>
    </AuthTemplate>
  );
}
