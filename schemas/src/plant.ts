import { z } from 'zod'
import { firestoreTimestampSchema, storageUrlSchema } from './common'
import { schemaVersionSchema } from './version'

// Trefle care block cached on the plant at add time; every field is nullable
// because Trefle coverage is uneven and custom plants have no care block.
export const careProfileSchema = z.object({
  tempMin: z.number().nullable(),
  tempMax: z.number().nullable(),
  watering: z.string().min(1).nullable(),
  fertilizing: z.string().min(1).nullable(),
})

export type CareProfile = z.infer<typeof careProfileSchema>

// users/{uid}/plants/{plantId}
export const plantSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().min(1).nullable(),
  trefleId: z.number().int().positive().nullable(),
  mainImage: storageUrlSchema.nullable(),
  care: careProfileSchema.nullable(),
  lastWateredAt: firestoreTimestampSchema.nullable(),
  lastFertilizedAt: firestoreTimestampSchema.nullable(),
  createdAt: firestoreTimestampSchema,
  schemaVersion: schemaVersionSchema,
})

export type Plant = z.infer<typeof plantSchema>
