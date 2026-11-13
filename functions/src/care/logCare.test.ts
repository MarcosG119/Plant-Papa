import { describe, expect, it, afterEach } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import { careLogCollectionPath, plantPath } from '../lib/paths'
import { logCareImpl } from './logCare'
import { createTestDb, destroyTestDb, type TestDb } from '../test/emulator'

// Runs under the Firestore emulator (`npm run test:emulator`) — the double-tap
// case exercises REAL transaction behavior, not mocks.
describe('logCare (emulator)', () => {
  let handle: TestDb

  async function seedPlant(): Promise<TestDb> {
    handle = await createTestDb(`test-care-${Date.now()}`)
    await handle.db
      .doc(plantPath('uid-a', 'plant-1'))
      .set({ name: 'Monty', schemaVersion: 1 })
    return handle
  }

  it('appends a careLog event and updates lastWateredAt', async () => {
    const { db } = await seedPlant()
    const result = await logCareImpl(db, 'uid-a', {
      plantId: 'plant-1',
      type: 'water',
    })
    expect(result.lastWateredAt).toBeInstanceOf(Timestamp)

    const events = await db
      .collection(careLogCollectionPath('uid-a', 'plant-1'))
      .get()
    expect(events.size).toBe(1)
    expect(events.docs[0].data().type).toBe('water')
    expect(events.docs[0].data().schemaVersion).toBe(1)
  })

  it('keeps the other timestamp untouched per event type', async () => {
    const { db } = await seedPlant()
    await logCareImpl(db, 'uid-a', { plantId: 'plant-1', type: 'water' })
    await logCareImpl(db, 'uid-a', { plantId: 'plant-1', type: 'fertilize' })
    const plant = await db.doc(plantPath('uid-a', 'plant-1')).get()
    expect(plant.data()?.lastWateredAt).toBeInstanceOf(Timestamp)
    expect(plant.data()?.lastFertilizedAt).toBeInstanceOf(Timestamp)
  })

  it('survives a rapid double-tap with exactly 2 events and consistent state', async () => {
    const { db } = await seedPlant()
    // Both invocations start before either commits — the transaction retries
    // must converge instead of losing or duplicating writes.
    const [a, b] = await Promise.all([
      logCareImpl(db, 'uid-a', { plantId: 'plant-1', type: 'water' }),
      logCareImpl(db, 'uid-a', { plantId: 'plant-1', type: 'water' }),
    ])

    const events = await db
      .collection(careLogCollectionPath('uid-a', 'plant-1'))
      .get()
    expect(events.size).toBe(2)

    const plant = await db.doc(plantPath('uid-a', 'plant-1')).get()
    const lastWateredAt = plant.data()?.lastWateredAt as Timestamp
    // The denormalized timestamp equals one of the two event times and is
    // never older than both.
    const eventTimes = events.docs.map((d) => d.data().at as Timestamp)
    expect(eventTimes.map((t) => t.toMillis())).toContain(
      lastWateredAt.toMillis(),
    )
    expect(lastWateredAt.toMillis()).toBe(
      Math.max(a.lastWateredAt!.toMillis(), b.lastWateredAt!.toMillis()),
    )
  })

  it('rejects care for a plant the caller does not own', async () => {
    const { db } = await seedPlant()
    await expect(
      logCareImpl(db, 'uid-b', { plantId: 'plant-1', type: 'water' }),
    ).rejects.toThrow('Plant not found.')
  })

  afterEach(async () => {
    if (handle) await destroyTestDb(handle)
  })
})
