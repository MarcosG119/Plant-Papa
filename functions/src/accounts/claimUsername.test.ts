import { describe, expect, it, afterEach } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import {
  usernameRegistryPath,
  userProfilePath,
} from '../lib/paths'
import { claimUsernameImpl, USERNAME_ERRORS } from './claimUsername'
import { createTestDb, destroyTestDb, type TestDb } from '../test/emulator'

// Runs under the Firestore emulator (`npm run test:emulator`) — the registry
// collision and release semantics are real transaction behavior, not mocks.
describe('claimUsername (emulator)', () => {
  let handle: TestDb

  async function seed(): Promise<TestDb> {
    handle = await createTestDb(`test-claim-${Date.now()}`)
    return handle
  }

  it('claims a username and writes registry + profile', async () => {
    const { db } = await seed()
    const result = await claimUsernameImpl(db, 'uid-a', { username: 'Monty_1' })
    expect(result.username).toBe('Monty_1')

    const registry = await db.doc(usernameRegistryPath('monty_1')).get()
    expect(registry.exists).toBe(true)
    expect(registry.data()?.uid).toBe('uid-a')
    expect(registry.data()?.schemaVersion).toBe(1)

    const profile = await db.doc(userProfilePath('uid-a')).get()
    expect(profile.data()?.username).toBe('Monty_1')
    expect(profile.data()?.usernameLower).toBe('monty_1')
  })

  it('rejects a duplicate case-insensitively', async () => {
    const { db } = await seed()
    await claimUsernameImpl(db, 'uid-a', { username: 'Monty' })
    await expect(
      claimUsernameImpl(db, 'uid-b', { username: 'MONTY' }),
    ).rejects.toThrow(USERNAME_ERRORS.taken)
  })

  it('rejects reserved names', async () => {
    const { db } = await seed()
    await expect(
      claimUsernameImpl(db, 'uid-a', { username: 'admin' }),
    ).rejects.toThrow(USERNAME_ERRORS.reserved)
  })

  it('rejects invalid formats', async () => {
    const { db } = await seed()
    for (const bad of ['ab', 'a'.repeat(21), 'has space', 'no-dash!', '']) {
      await expect(
        claimUsernameImpl(db, 'uid-a', { username: bad as never }),
      ).rejects.toThrow()
    }
  })

  it('releases the old handle when changing', async () => {
    const { db } = await seed()
    await claimUsernameImpl(db, 'uid-a', { username: 'first_handle' })
    await claimUsernameImpl(db, 'uid-a', { username: 'second_handle' })

    const old = await db.doc(usernameRegistryPath('first_handle')).get()
    expect(old.exists).toBe(false)
    const current = await db.doc(usernameRegistryPath('second_handle')).get()
    expect(current.exists).toBe(true)
    // The released handle is claimable by someone else.
    await expect(
      claimUsernameImpl(db, 'uid-b', { username: 'first_handle' }),
    ).resolves.toEqual({ username: 'first_handle' })
  })

  it('is idempotent when re-claiming your own handle', async () => {
    const { db } = await seed()
    await claimUsernameImpl(db, 'uid-a', { username: 'monty' })
    await expect(
      claimUsernameImpl(db, 'uid-a', { username: 'MONTY' }),
    ).resolves.toEqual({ username: 'MONTY' })
    const profile = await db.doc(userProfilePath('uid-a')).get()
    expect(profile.data()?.createdAt).toBeInstanceOf(Timestamp)
  })

  afterEach(async () => {
    if (handle) await destroyTestDb(handle)
  })
})
