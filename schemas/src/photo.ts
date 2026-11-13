import { z } from 'zod'
import { firestoreTimestampSchema, storageUrlSchema } from './common'
import { schemaVersionSchema } from './version'

// users/{uid}/plants/{plantId}/photos/{photoId}
export const photoSchema = z.object({
  url: storageUrlSchema,
  takenAt: firestoreTimestampSchema,
  caption: z.string().min(1).max(500).optional(),
  schemaVersion: schemaVersionSchema,
})

export type Photo = z.infer<typeof photoSchema>
