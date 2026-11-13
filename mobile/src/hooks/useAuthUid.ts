import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '@/services/firebase';

/**
 * Current auth uid: undefined until Firebase resolves the persisted session,
 * null when signed out. Auth screens (separate task) own sign-in/out; every
 * data hook keys off this value.
 */
export function useAuthUid(): string | null | undefined {
  const [uid, setUid] = useState<string | null | undefined>(undefined);

  useEffect(
    () => onAuthStateChanged(auth, (user) => setUid(user?.uid ?? null)),
    [],
  );

  return uid;
}
