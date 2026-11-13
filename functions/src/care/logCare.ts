import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import {
  careEventTypeSchema,
  careLogEventSchema,
  CURRENT_SCHEMA_VERSION,
  type CareEventType,
} from '@plant-papa/schemas'
import { invalidArgument, notFound } from '../lib/errors'
import { requireAuth } from '../lib/guards'
import { plantPath } from '../lib/paths'
import { assertValid } from '../lib/validate'

const inputSchema = z.object({
  plantId: z.string().min(1),
  type: careEventTypeSchema,
  note: z.string().min(1).max(2000).optional(),
})

export type LogCareInput = z.infer<typeof inputSchema>

export interface LogCareResult {
  lastWateredAt: Timestamp | null
  lastFertilizedAt: Timestamp | null
}

// Appends the careLog event and updates the plant's denormalized last-care
// timestamp in ONE transaction, so a rapid double-tap can never leave the
// plant document inconsistent with its log (two events, or a stale timestamp).
export async function logCareImpl(
  db: Firestore,
  uid: string,
  input: LogCareInput,
): Promise<LogCareResult> {
  const plantRef = db.doc(plantPath(uid, input.plantId))

  return db.runTransaction(async (tx): Promise<LogCareResult> => {
    const plantSnap = await tx.get(plantRef)
    if (!plantSnap.exists) {
      throw notFound('Plant not found.')
    }
    const plant = plantSnap.data()

    // Real Timestamp instance — see lib/validate for why never .parse().
    const event = {
      type: input.type as CareEventType,
      at: Timestamp.now(),
      ...(input.note !== undefined ? { note: input.note } : {}),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }
    assertValid(careLogEventSchema, event)
    const eventRef = plantRef.collection('careLog').doc()
    tx.set(eventRef, event)

    const lastWateredAt =
      input.type === 'water'
        ? event.at
        : ((plant?.lastWateredAt as Timestamp | undefined) ?? null)
    const lastFertilizedAt =
      input.type === 'fertilize'
        ? event.at
        : ((plant?.lastFertilizedAt as Timestamp | undefined) ?? null)

    tx.update(plantRef, { lastWateredAt, lastFertilizedAt })
    return { lastWateredAt, lastFertilizedAt }
  })
}

export const logCare = onCall(async (request) => {
  const uid = requireAuth(request)
  const parsed = inputSchema.safeParse(request.data)
  if (!parsed.success) {
    throw invalidArgument(
      'Expected { plantId: string, type: "water" | "fertilize", note?: string }.',
    )
  }
  return logCareImpl(getFirestore(), uid, parsed.data)
})
