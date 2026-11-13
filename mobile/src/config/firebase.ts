import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Same Firebase project and web config the web app uses (src/config/firebase.ts),
// so mobile shares accounts, gardens, and callables with zero migration.
const firebaseConfig = {
  apiKey: 'AIzaSyDfUO83Q-7_pHvEretn2ZcuH0krfSI6XrA',
  authDomain: 'plant-papa.firebaseapp.com',
  projectId: 'plant-papa',
  storageBucket: 'plant-papa.appspot.com',
  messagingSenderId: '487304988103',
  appId: '1:487304988103:web:16de89072b2a5661b8c5e2',
};

let app: FirebaseApp | undefined;

function getApp(): FirebaseApp {
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

// Service handles are created lazily and cached so screens and services share
// one instance regardless of import order.
let auth: Auth | undefined;
let db: Firestore | undefined;
let functions: Functions | undefined;
let storage: FirebaseStorage | undefined;

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getApp());
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getApp());
  return db;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) functions = getFunctions(getApp());
  return functions;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getApp());
  return storage;
}
