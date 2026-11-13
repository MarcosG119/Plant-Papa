import { z } from 'zod'
import { firestoreTimestampSchema } from './common'
import { schemaVersionSchema } from './version'

export const careEventTypeSchema = z.enum(['water', 'fertilize'])

export type CareEventType = z.infer<typeof careEventTypeSchema>

// users/{uid}/plants/{plantId}/careLog/{eventId} — append-only history.
export const careLogEventSchema = z.object({
  type: careEventTypeSchema,
  at: firestoreTimestampSchema,
  note: z.string().min(1).max(2000).optional(),
  schemaVersion: schemaVersionSchema,
})

export type CareLogEvent = z.infer<typeof careLogEventSchema>
