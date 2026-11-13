// Platform entry point: consumers import '@/services/firebase' and get the
// right auth instance per platform (authInstance.ts for native, .web.ts for
// web — Metro picks the extension).
export { firebaseApp as app, db, functions } from './firebaseApp';
export { auth } from './authInstance';
