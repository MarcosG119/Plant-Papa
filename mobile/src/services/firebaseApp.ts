import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, type Functions } from 'firebase/functions';

import { firebaseConfig } from './firebaseConfig';

// getApps() guard: Fast Refresh re-evaluates this module without unmounting the app.
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const db: Firestore = getFirestore(firebaseApp);
export const functions: Functions = getFunctions(firebaseApp);

// Local verification against the Firebase emulator suite; never set in
// production builds. EXPO_PUBLIC_* vars are inlined by the Expo bundler.
if (process.env.EXPO_PUBLIC_USE_EMULATORS === '1') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}
