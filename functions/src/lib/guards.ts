import type { CallableRequest } from 'firebase-functions/v2/https'
import { unauthenticated } from './errors'

// Every callable verifies auth first — no anonymous access to any domain.
export function requireAuth<T>(request: CallableRequest<T>): string {
  const uid = request.auth?.uid
  if (!uid) {
    throw unauthenticated('You must be signed in to call this function.')
  }
  return uid
}
