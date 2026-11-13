// firebase v13 ships the React Native auth build (which exports
// getReactNativePersistence) under the "react-native" condition — what Metro
// resolves at runtime — but the package's top-level "types" entry still points
// at the web API, which lacks the function. This augmentation aligns tsc with
// the build that actually ships; it is removed when the Firebase typings catch up.
import type { Persistence } from 'firebase/auth';

interface AsyncStorageLike {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: AsyncStorageLike): Persistence;
}
