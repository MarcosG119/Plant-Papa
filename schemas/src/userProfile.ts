import { z } from 'zod'
import { firestoreTimestampSchema } from './common'
import { schemaVersionSchema } from './version'
import { usernameLowerSchema, usernameSchema } from './usernames'

// users/{uid}
export const userProfileSchema = z
  .object({
    displayName: z.string().min(1).max(100),
    photoURL: z.string().url().nullable(),
    username: usernameSchema,
    usernameLower: usernameLowerSchema,
    createdAt: firestoreTimestampSchema,
    schemaVersion: schemaVersionSchema,
  })
  .refine(
    (user) => user.username.toLowerCase() === user.usernameLower,
    { message: 'usernameLower must be the lowercased username' },
  )

export type UserProfile = z.infer<typeof userProfileSchema>
