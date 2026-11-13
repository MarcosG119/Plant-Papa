import { z } from 'zod'
import { firestoreTimestampSchema } from './common'
import { schemaVersionSchema } from './version'

// users/{uid}/plants/{plantId}/notes/{noteId}
export const noteSchema = z.object({
  text: z.string().min(1).max(5000),
  createdAt: firestoreTimestampSchema,
  updatedAt: firestoreTimestampSchema,
  schemaVersion: schemaVersionSchema,
})

export type Note = z.infer<typeof noteSchema>
