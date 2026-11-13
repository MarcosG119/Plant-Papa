import { z } from 'zod'

// Both the client SDK (firebase) and the admin SDK model timestamps as
// { seconds, nanoseconds }. The loose object keeps real Timestamp instances
// intact instead of coercing them into plain objects that lose their methods.
export const firestoreTimestampSchema = z
  .object({
    seconds: z.number().int().nonnegative(),
    nanoseconds: z.number().int().min(0).max(999_999_999),
  })
  .passthrough()

export type FirestoreTimestamp = z.infer<typeof firestoreTimestampSchema>

// Storage object references: gs:// bucket paths written by the SDK, or the
// https download URLs generated from them.
export const storageUrlSchema = z
  .string()
  .min(1)
  .refine(
    (url) => url.startsWith('gs://') || url.startsWith('https://'),
    'must be a gs:// or https:// URL',
  )
