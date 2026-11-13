import { FunctionsError, httpsCallable, type Functions } from 'firebase/functions';

export type ClaimUsernameOutcome =
  | { ok: true; username: string }
  | { ok: false; reason: 'taken' | 'reserved' | 'invalid' | 'unavailable'; message: string };

// The claimUsername function's error message doubles as its typed outcome
// string ('username/taken', 'username/reserved', 'username/invalid') — see
// functions/src/lib/errors.ts and accounts/claimUsername.ts.
const OUTCOME_MESSAGES: Record<string, { reason: 'taken' | 'reserved' | 'invalid'; message: string }> = {
  'username/taken': { reason: 'taken', message: 'That username is taken — try another.' },
  'username/reserved': { reason: 'reserved', message: 'That username is reserved.' },
  'username/invalid': {
    reason: 'invalid',
    message: 'Usernames are 3-20 letters, numbers, or underscores.',
  },
};

export async function claimUsername(fns: Functions, rawUsername: string): Promise<ClaimUsernameOutcome> {
  const callable = httpsCallable<{ username: string }, { username: string }>(fns, 'claimUsername');
  try {
    const result = await callable({ username: rawUsername });
    return { ok: true, username: result.data.username };
  } catch (error) {
    if (error instanceof FunctionsError) {
      const known = OUTCOME_MESSAGES[error.message];
      if (known) return { ok: false, ...known };
    }
    return {
      ok: false,
      reason: 'unavailable',
      message: 'Could not check that username — please try again.',
    };
  }
}
