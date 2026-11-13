import { useEffect, useMemo } from 'react';
import * as Google from 'expo-auth-session/providers/google';

interface UseGoogleSignInResult {
  /** False when no OAuth client id is configured — screens hide the button instead of failing. */
  configured: boolean;
  prompt: () => void;
}

type GoogleSuccessHandler = (idToken: string) => void;

// Wraps expo-auth-session's Google provider: hands the idToken to the caller,
// which exchanges it for a Firebase credential. Client ids come from
// EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID / EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and are
// not secrets — they identify the OAuth app, they do not authenticate anyone.
export function useGoogleSignIn(onSuccess: GoogleSuccessHandler): UseGoogleSignInResult {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const configured = Boolean(webClientId ?? iosClientId);

  // A placeholder client id keeps the hook callable when unconfigured; the
  // prompt button is hidden in that case, so the placeholder is never used.
  const [, response, promptAsync] = Google.useAuthRequest(
    useMemo(
      () => ({ clientId: webClientId ?? iosClientId ?? 'google-not-configured' }),
      [webClientId, iosClientId],
    ),
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken = response.authentication?.idToken;
    if (idToken) onSuccess(idToken);
  }, [response, onSuccess]);

  const prompt = () => {
    void promptAsync().catch((error) => {
      // Surfaced, not swallowed: the caller shows it as a form error.
      console.warn('Google sign-in prompt failed', error);
    });
  };

  return { configured, prompt };
}
