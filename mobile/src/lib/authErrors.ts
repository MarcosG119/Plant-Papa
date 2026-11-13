import { FirebaseError } from 'firebase/app';

// Only codes a user can act on get specific copy; everything else gets one
// honest retry line instead of provider jargon.
const KNOWN_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account uses that email yet.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account already exists with this email — sign in instead.',
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/too-many-requests': 'Too many attempts — please wait a moment and try again.',
  'auth/network-request-failed': 'You appear to be offline. Check your connection and try again.',
  'auth/user-cancelled': 'Google sign-in was cancelled.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
};

export function describeAuthError(error: unknown): string {
  if (error instanceof FirebaseError && KNOWN_MESSAGES[error.code]) {
    return KNOWN_MESSAGES[error.code];
  }
  return 'Something went wrong — please try again.';
}
