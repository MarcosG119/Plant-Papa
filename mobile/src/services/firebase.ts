import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
// @firebase/auth is imported directly rather than 'firebase/auth' so TypeScript
// resolves the react-native entry: initializeAuth and getReactNativePersistence
// exist only in that entry's types.
import { getReactNativePersistence, initializeAuth, type Auth } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { firebaseConfig } from './firebaseConfig';

// getApps() guard: Fast Refresh re-evaluates this module without unmounting the app.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// initializeAuth (not getAuth): AsyncStorage persistence keeps the session
// across launches; getAuth falls back to in-memory storage in React Native.
export const auth: Auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);
