import { useEffect, useMemo } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { Platform } from 'react-native';

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
  // On web, pin the redirect to the origin root so one Google OAuth client
  // whitelist entry (http://localhost:8081/ in dev) covers every screen path;
  // expo-auth-session would otherwise derive it from window.location (the
  // current screen path) and each path would need its own registration.
  // Native platforms are left undefined so they keep deriving the correct
  // custom-scheme redirect themselves.
  const [, response, promptAsync] = Google.useAuthRequest(
    useMemo(
      () => ({
        clientId: webClientId ?? iosClientId ?? 'google-not-configured',
        // typeof-guard keeps this SSR-safe: Expo static web renders on the
        // server first, where window is not defined.
        redirectUri: Platform.OS === 'web' && typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
      }),
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
