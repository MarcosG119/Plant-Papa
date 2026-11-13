import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from '@firebase/auth';

import { auth } from '@/services/firebase';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(
    () =>
      onAuthStateChanged(auth, (next) => {
        setUser(next);
        setStatus(next ? 'signedIn' : 'signedOut');
      }),
    [],
  );

  return <AuthContext.Provider value={{ status, user }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return value;
}
