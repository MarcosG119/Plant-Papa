import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

import { firebaseApp } from './firebaseApp';

// getAuth applies the web default (browser localStorage) persistence.
export const auth: Auth = getAuth(firebaseApp);

if (process.env.EXPO_PUBLIC_USE_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}
