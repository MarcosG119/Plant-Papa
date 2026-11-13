import { HttpsError } from 'firebase-functions/v2/https'

// One place maps domain failures to callable error codes. The `message`
// doubles as the typed error string the mobile client branches on
// (e.g. `username/taken`).
export const unauthenticated = (message: string) =>
  new HttpsError('unauthenticated', message)
export const invalidArgument = (message: string) =>
  new HttpsError('invalid-argument', message)
export const notFound = (message: string) => new HttpsError('not-found', message)
export const alreadyExists = (message: string) =>
  new HttpsError('already-exists', message)
export const permissionDenied = (message: string) =>
  new HttpsError('permission-denied', message)
export const resourceExhausted = (message: string) =>
  new HttpsError('resource-exhausted', message)
export const internalError = (message: string) =>
  new HttpsError('internal', message)
