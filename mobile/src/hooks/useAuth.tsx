import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, type User } from '@firebase/auth';

import { auth, db } from '@/services/firebase';

export type AuthStatus = 'loading' | 'signedOut' | 'needsUsername' | 'ready' | 'error';

export interface UsernameClaim {
  username: string;
  usernameLower: string;
}

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  username: string | null;
  /** Re-subscribes the profile listener after a failure. */
  retryProfile: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// The gate needs exactly one fact from the profile document: is a username
// claimed. Full schema-mapped profile reads arrive with the data features.
export function readUsernameClaim(data: Record<string, unknown> | undefined): UsernameClaim | null {
  if (typeof data?.username !== 'string' || typeof data?.usernameLower !== 'string') {
    return null;
  }
  return { username: data.username, usernameLower: data.usernameLower };
}

interface StatusInputs {
  authLoaded: boolean;
  user: User | null;
  claim: UsernameClaim | null;
  profileLoaded: boolean;
  profileFailed: boolean;
}

export function deriveAuthStatus({
  authLoaded,
  user,
  claim,
  profileLoaded,
  profileFailed,
}: StatusInputs): AuthStatus {
  if (!authLoaded || !user) {
    return authLoaded ? 'signedOut' : 'loading';
  }
  if (profileFailed) return 'error';
  if (!profileLoaded) return 'loading';
  return claim ? 'ready' : 'needsUsername';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [claim, setClaim] = useState<UsernameClaim | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileFailed, setProfileFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setAuthLoaded(true);
        // Re-arm the profile watch for the new (or cleared) session.
        setClaim(null);
        setProfileLoaded(false);
        setProfileFailed(false);
      }),
    [],
  );

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setClaim(readUsernameClaim(snap.data()));
        setProfileLoaded(true);
        setProfileFailed(false);
      },
      (error) => {
        // Surface, never swallow: the gate shows a retry state instead of a
        // splash that never lifts.
        console.error('Profile listener failed', error);
        setProfileFailed(true);
        setProfileLoaded(true);
      },
    );
  }, [user, attempt]);

  const retryProfile = useCallback(() => setAttempt((n) => n + 1), []);

  const status = deriveAuthStatus({ authLoaded, user, claim, profileLoaded, profileFailed });

  return (
    <AuthContext.Provider
      value={{ status, user, username: claim?.username ?? null, retryProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
