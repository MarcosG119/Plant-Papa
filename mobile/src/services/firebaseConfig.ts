// Firebase web config is public by design — it identifies the project, it does
// not authorize anything (security rules do). The values mirror the committed
// web app config (src/config/firebase.ts); EXPO_PUBLIC_ overrides point the
// app at a different Firebase environment without code changes.
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? 'AIzaSyDfUO83Q-7_pHvEretn2ZcuH0krfSI6XrA',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? 'plant-papa.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? 'plant-papa',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? 'plant-papa.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID ?? '487304988103',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '1:487304988103:web:16de89072b2a5661b8c5e2',
} as const;
