import { Link } from 'expo-router';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { Button } from '@/components/atoms/Button';

// Placeholder screen: real sign-in arrives with the auth subtask.
export default function SignIn() {
  const { colors, typography } = useTheme();

  return (
    <AuthTemplate
      title={<Text style={[typography.heading, { color: colors.text }]}>Sign in to Plant Papa</Text>}
    >
      <Button label="Sign in" disabled />
      <Text style={[typography.caption, { color: colors.textMuted, textAlign: 'center' }]}>
        Sign-in is wired in the auth milestone.
      </Text>
      <Link href="/(auth)/sign-up" asChild>
        <Text style={[typography.body, { color: colors.primary, textAlign: 'center' }]}>
          Don&apos;t have an account? Sign up
        </Text>
      </Link>
    </AuthTemplate>
  );
}
