import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import { plantSchema, CURRENT_SCHEMA_VERSION } from '@plant-papa/schemas'
import { requireAuth } from '../lib/guards'
import { legacyGardenPath, plantPath } from '../lib/paths'
import { assertValid } from '../lib/validate'

// Legacy web-era shape: myGarden/{uid} holds one field per plant, keyed by
// uniquePlantId (read from src/pages/myGarden/MyGarden.tsx). Fields are loose —
// anything unmappable is skipped, never guessed.
const legacyPlantSchema = z.object({
  plantName: z.string().optional(),
  scientificName: z.string().optional(),
  picture: z.string().optional(),
  description: z.string().optional(),
  lastWatered: z.string().optional(),
  uniquePlantId: z.union([z.string(), z.number()]).optional(),
})
// Every field is optional (legacy rows are inconsistent), but a shape with
// NONE of them is not a plant — without this, arbitrary junk fields migrate.
  .refine(
    (v) =>
      v.plantName !== undefined ||
      v.scientificName !== undefined ||
      v.picture !== undefined ||
      v.uniquePlantId !== undefined,
  )

export function parseLegacyLastWatered(
  value: string | undefined,
): Timestamp | null {
  if (!value) return null
  const parsed = new Date(value)
  // Legacy values are locale strings that may not parse; null (never) is the
  // honest fallback.
  return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed)
}

export async function backfillGardenImpl(
  db: Firestore,
  uid: string,
): Promise<{ migrated: number }> {
  const legacySnap = await db.doc(legacyGardenPath(uid)).get()
  if (!legacySnap.exists) {
    return { migrated: 0 }
  }
  const legacyData = legacySnap.data() ?? {}

  const writes: Array<{ plantId: string; doc: Record<string, unknown> }> = []
  for (const [key, value] of Object.entries(legacyData)) {
    const parsed = legacyPlantSchema.safeParse(value)
    if (!parsed.success) continue // not a plant field — leave it alone
    const legacy = parsed.data
    const plantId = String(legacy.uniquePlantId ?? key)
    const trefleId = /^\d+$/.test(key) ? Number(key) : null

    // Real Timestamp instances — see lib/validate for why never .parse().
    const doc = {
      name: legacy.plantName || `Plant ${plantId}`,
      species: legacy.scientificName || null,
      trefleId,
      mainImage: legacy.picture || null,
      care: null, // care is fetched fresh from Trefle on the mobile side
      lastWateredAt: parseLegacyLastWatered(legacy.lastWatered),
      lastFertilizedAt: null,
      createdAt: Timestamp.now(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }
    assertValid(plantSchema, doc)
    writes.push({ plantId, doc })
  }

  // Idempotency: skip plants that already exist in the new layout, so a
  // re-run migrates zero.
  const existing = await Promise.all(
    writes.map((w) => db.doc(plantPath(uid, w.plantId)).get()),
  )
  const pending = writes.filter((_, i) => !existing[i].exists)

  // Batched writes, 500 per batch.
  for (let i = 0; i < pending.length; i += 500) {
    const batch = db.batch()
    for (const w of pending.slice(i, i + 500)) {
      batch.set(db.doc(plantPath(uid, w.plantId)), w.doc)
    }
    await batch.commit()
  }

  return { migrated: pending.length }
}

// One-time migration for web-era users. The caller migrates their OWN garden —
// security rules scope every user to their own documents, and this callable
// does not widen that.
export const backfillGarden = onCall(async (request) => {
  const uid = requireAuth(request)
  return backfillGardenImpl(getFirestore(), uid)
})
