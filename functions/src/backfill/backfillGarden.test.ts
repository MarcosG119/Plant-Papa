import { describe, expect, it, afterEach } from 'vitest'
import { plantSchema } from '@plant-papa/schemas'
import { legacyGardenPath, plantPath } from '../lib/paths'
import { backfillGardenImpl } from './backfillGarden'
import { createTestDb, destroyTestDb, type TestDb } from '../test/emulator'

// Runs under the Firestore emulator (`npm run test:emulator`).
describe('backfillGarden (emulator)', () => {
  let handle: TestDb | undefined

  async function seedLegacy(): Promise<TestDb> {
    handle = await createTestDb(`test-backfill-${Date.now()}`)
    await handle.db.doc(legacyGardenPath('uid-a')).set({
      // Web-era shape: plant fields keyed by uniquePlantId (MyGarden.tsx).
      '12345': {
        uniquePlantId: '12345',
        plantName: 'Monty',
        scientificName: 'Monstera adansonii',
        picture: 'https://example.com/monty.jpg',
        description: 'a monstera',
        lastWatered: '2026-11-10T10:00:00.000Z',
      },
      '67890': {
        uniquePlantId: '67890',
        plantName: 'Fern',
        scientificName: 'Nephrolepis exaltata',
        picture: '',
        lastWatered: '',
      },
      // A non-plant field must be skipped, not crash.
      somethingElse: { random: true },
    })
    return handle
  }

  it('migrates legacy plants into users/{uid}/plants', async () => {
    const { db } = await seedLegacy()
    const result = await backfillGardenImpl(db, 'uid-a')
    expect(result.migrated).toBe(2)

    const monty = await db.doc(plantPath('uid-a', '12345')).get()
    expect(monty.data()?.name).toBe('Monty')
    expect(monty.data()?.trefleId).toBe(12345)
    expect(monty.data()?.lastWateredAt).not.toBeNull()
    // Migrated docs validate against the shared plant schema.
    expect(plantSchema.safeParse(monty.data()).success).toBe(true)

    const fern = await db.doc(plantPath('uid-a', '67890')).get()
    expect(fern.data()?.lastWateredAt).toBeNull()
    expect(plantSchema.safeParse(fern.data()).success).toBe(true)
  })

  it('migrates zero on re-run (idempotent)', async () => {
    const { db } = await seedLegacy()
    await backfillGardenImpl(db, 'uid-a')
    const second = await backfillGardenImpl(db, 'uid-a')
    expect(second.migrated).toBe(0)
  })

  it('migrates zero for users with no legacy garden', async () => {
    handle = await createTestDb(`test-backfill-empty-${Date.now()}`)
    const result = await backfillGardenImpl(handle.db, 'uid-none')
    expect(result.migrated).toBe(0)
  })

  afterEach(async () => {
    if (handle) await destroyTestDb(handle)
    handle = undefined
  })
})
