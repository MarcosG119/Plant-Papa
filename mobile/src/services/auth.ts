import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  type Auth,
  type User,
} from '@firebase/auth';

// One auth write per flow: createUserWithEmailAndPassword already establishes
// the session, so there is no follow-up signIn (the web app's double-sign-in
// bug is not ported).
export async function createAccount(auth: Auth, email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithEmail(auth: Auth, email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// The Google idToken comes from expo-auth-session; it is exchanged for a
// Firebase credential here so screens never touch provider plumbing.
export async function signInWithGoogleIdToken(auth: Auth, idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function sendPasswordReset(auth: Auth, email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser(auth: Auth): Promise<void> {
  await firebaseSignOut(auth);
}
