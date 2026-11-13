import type { Firestore } from 'firebase-admin/firestore'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import {
  CURRENT_SCHEMA_VERSION,
  usernameSchema,
  userProfileSchema,
} from '@plant-papa/schemas'
import { invalidArgument, alreadyExists } from '../lib/errors'
import { requireAuth } from '../lib/guards'
import {
  userProfilePath,
  usernameRegistryPath,
} from '../lib/paths'
import { assertValid } from '../lib/validate'
import { RESERVED_USERNAMES } from './reservedUsernames'

const inputSchema = z.object({
  username: usernameSchema,
})

export type ClaimUsernameInput = z.infer<typeof inputSchema>

// Typed outcomes the mobile client branches on.
export const USERNAME_ERRORS = {
  taken: 'username/taken',
  reserved: 'username/reserved',
} as const

export async function claimUsernameImpl(
  db: Firestore,
  uid: string,
  input: ClaimUsernameInput,
): Promise<{ username: string }> {
  const username = input.username
  const lower = username.toLowerCase()
  if (RESERVED_USERNAMES.has(lower)) {
    throw invalidArgument(USERNAME_ERRORS.reserved)
  }
  const registryRef = db.doc(usernameRegistryPath(lower))
  const profileRef = db.doc(userProfilePath(uid))

  await db.runTransaction(async (tx) => {
    // Reads before writes, always.
    const [registrySnap, profileSnap] = await Promise.all([
      tx.get(registryRef),
      tx.get(profileRef),
    ])

    if (registrySnap.exists) {
      const owner = registrySnap.data()?.uid as string | undefined
      if (owner !== uid) {
        // Doc-id collision is the uniqueness guarantee: another user holds it.
        throw alreadyExists(USERNAME_ERRORS.taken)
      }
      // Re-claiming your own handle is a no-op — idempotent retry.
      return
    }

    tx.set(registryRef, { uid, schemaVersion: CURRENT_SCHEMA_VERSION })

    if (profileSnap.exists) {
      const previousLower = profileSnap.data()?.usernameLower as
        | string
        | undefined
      if (previousLower && previousLower !== lower) {
        // Changing a handle releases the old one in the same transaction.
        tx.delete(db.doc(usernameRegistryPath(previousLower)))
      }
      tx.set(profileRef, { username, usernameLower: lower }, { merge: true })
    } else {
      // Real Timestamp instance — see lib/validate for why never .parse().
      const profile = {
        displayName: username,
        photoURL: null,
        username,
        usernameLower: lower,
        createdAt: Timestamp.now(),
        schemaVersion: CURRENT_SCHEMA_VERSION,
      }
      assertValid(userProfileSchema, profile)
      tx.set(profileRef, profile)
    }
  })

  return { username }
}

export const claimUsername = onCall(async (request) => {
  const uid = requireAuth(request)
  const parsed = inputSchema.safeParse(request.data)
  if (!parsed.success) {
    // Message shape is stable for the client: username/invalid.
    throw invalidArgument('username/invalid')
  }
  return claimUsernameImpl(getFirestore(), uid, parsed.data)
})
