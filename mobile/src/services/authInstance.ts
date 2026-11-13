import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  connectAuthEmulator,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';

import { firebaseApp } from './firebaseApp';

// initializeAuth (not getAuth): explicit AsyncStorage persistence keeps the
// session across launches; the fallback would be in-memory in React Native.
// getReactNativePersistence exists only in the native auth bundle.
export const auth: Auth = initializeAuth(firebaseApp, {
  persistence: getReactNativePersistence(AsyncStorage),
});

if (process.env.EXPO_PUBLIC_USE_EMULATORS === '1') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
}
