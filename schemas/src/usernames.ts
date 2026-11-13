import { z } from 'zod'
import { schemaVersionSchema } from './version'

// 3-20 chars: letters, digits, underscore. Shared by claimUsername's input
// validation and the profile fields, so handle rules live in exactly one place.
export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/

export const usernameSchema = z.string().regex(USERNAME_PATTERN)

export const usernameLowerSchema = z.string().regex(/^[a-z0-9_]{3,20}$/)

// usernames/{usernameLower} — doc-id collision is the uniqueness guarantee;
// written only by the claimUsername function.
export const usernameRegistrySchema = z.object({
  uid: z.string().min(1),
  schemaVersion: schemaVersionSchema,
})

export type UsernameRegistry = z.infer<typeof usernameRegistrySchema>
