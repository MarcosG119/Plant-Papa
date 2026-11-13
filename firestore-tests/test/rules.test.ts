import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'

// The suite runs inside `firebase emulators:exec`, which points the Firebase
// SDKs at the local emulator; the rules under test are loaded from the repo
// root so the suite can never drift from what ships.
const rules = readFileSync(
  fileURLToPath(new URL('../../firestore.rules', import.meta.url)),
  'utf8',
)

const ALICE = 'alice-uid'
const BOB = 'bob-uid'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-plant-papa',
    firestore: { rules },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

// rules-unit-testing v3 hands out the compat Firestore instance; the suite
// uses the compat API against it.
const aliceDb = () => testEnv.authenticatedContext(ALICE).firestore()
type Db = ReturnType<typeof aliceDb>
type Write = (db: Db) => Promise<unknown>

const ctx = {
  alice: aliceDb,
  bob: () => testEnv.authenticatedContext(BOB).firestore(),
  anon: () => testEnv.unauthenticatedContext().firestore(),
}

// Seeds Alice's and Bob's gardens (profile, plant, note, photo, chat) with
// rules disabled — only shapes that exist matter here, not validity. The
// context is cleaned up when the callback returns, so all writes happen inside.
async function seedGardens(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
    const admin = adminCtx.firestore()
    for (const uid of [ALICE, BOB]) {
      await admin.doc(`users/${uid}`).set({ displayName: uid })
      await admin.doc(`users/${uid}/plants/p1`).set({ name: 'Monty' })
      await admin.doc(`users/${uid}/plants/p1/careLog/e1`).set({ type: 'water' })
      await admin.doc(`users/${uid}/plants/p1/notes/n1`).set({ text: 'growing well' })
      await admin
        .doc(`users/${uid}/plants/p1/photos/ph1`)
        .set({ url: 'gs://bucket/photo.jpg' })
      await admin.doc(`users/${uid}/plants/p1/chats/c1`).set({})
    }
  })
}

// Seeds one claimed handle; only claimUsername (Admin SDK) writes these.
async function seedRegistry(): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
    await adminCtx.firestore().doc('usernames/monty').set({ uid: ALICE })
  })
}

describe('per-user isolation under users/{uid}/…', () => {
  beforeEach(seedGardens)

  it('owner reads their own profile, plant, notes, photos, and chats', async () => {
    const db = ctx.alice()
    await assertSucceeds(db.doc(`users/${ALICE}`).get())
    await assertSucceeds(db.doc(`users/${ALICE}/plants/p1`).get())
    await assertSucceeds(db.doc(`users/${ALICE}/plants/p1/notes/n1`).get())
    await assertSucceeds(db.doc(`users/${ALICE}/plants/p1/photos/ph1`).get())
    await assertSucceeds(db.doc(`users/${ALICE}/plants/p1/chats/c1`).get())
  })

  it.each([
    ['user profile', (uid: string) => `users/${uid}`],
    ['plant', (uid: string) => `users/${uid}/plants/p1`],
    ['care log event', (uid: string) => `users/${uid}/plants/p1/careLog/e1`],
    ['note', (uid: string) => `users/${uid}/plants/p1/notes/n1`],
    ['photo', (uid: string) => `users/${uid}/plants/p1/photos/ph1`],
    ['chat', (uid: string) => `users/${uid}/plants/p1/chats/c1`],
  ])('user A cannot read user B\'s %s', async (_label, path) => {
    await assertFails(ctx.alice().doc(path(BOB)).get())
  })

  it.each([
    ['plants', (uid: string) => `users/${uid}/plants`],
    ['notes', (uid: string) => `users/${uid}/plants/p1/notes`],
    ['photos', (uid: string) => `users/${uid}/plants/p1/photos`],
    ['chats', (uid: string) => `users/${uid}/plants/p1/chats`],
  ])('user A cannot list user B\'s %s', async (_label, path) => {
    await assertFails(ctx.alice().collection(path(BOB)).get())
  })

  it.each([
    ['create a plant', (db: Db) => db.doc(`users/${BOB}/plants/p2`).set({ name: 'x' })],
    ['update a plant', (db: Db) => db.doc(`users/${BOB}/plants/p1`).set({ name: 'hacked' }, { merge: true })],
    ['delete a plant', (db: Db) => db.doc(`users/${BOB}/plants/p1`).delete()],
    ['write a note', (db: Db) => db.doc(`users/${BOB}/plants/p1/notes/n2`).set({ text: 'x' })],
  ] satisfies [string, Write][])('user A cannot %s of user B', async (_label, write) => {
    await assertFails(write(ctx.alice()))
  })

  it('user A cannot read or write user B\'s profile', async () => {
    const db = ctx.alice()
    await assertFails(db.doc(`users/${BOB}`).get())
    await assertFails(db.doc(`users/${BOB}`).set({ displayName: 'hacked' }, { merge: true }))
    await assertFails(db.doc(`users/${BOB}`).delete())
  })
})

describe('unauthenticated access', () => {
  beforeEach(seedGardens)

  it('cannot read profiles or gardens', async () => {
    const db = ctx.anon()
    await assertFails(db.doc(`users/${ALICE}`).get())
    await assertFails(db.doc(`users/${ALICE}/plants/p1`).get())
    await assertFails(db.doc(`users/${ALICE}/plants/p1/notes/n1`).get())
    await assertFails(db.doc(`users/${ALICE}/plants/p1/photos/ph1`).get())
    await assertFails(db.doc(`users/${ALICE}/plants/p1/chats/c1`).get())
    await assertFails(db.collection(`users/${ALICE}/plants`).get())
  })

  it('cannot read the usernames registry', async () => {
    await assertFails(ctx.anon().doc('usernames/monty').get())
  })

  it('cannot write anywhere', async () => {
    const db = ctx.anon()
    await assertFails(db.doc(`users/${ALICE}/plants/p2`).set({ name: 'x' }))
    await assertFails(db.doc('usernames/monty').set({ uid: ALICE }))
  })
})

describe('usernames registry', () => {
  it('is readable by signed-in users (handle lookup)', async () => {
    await seedRegistry()
    await assertSucceeds(ctx.bob().doc('usernames/monty').get())
  })

  it.each([
    ['create', (db: Db) => db.doc('usernames/monty').set({ uid: ALICE })],
    ['update', (db: Db) => db.doc('usernames/monty').set({ uid: BOB }, { merge: true })],
    ['delete', (db: Db) => db.doc('usernames/monty').delete()],
  ] satisfies [string, Write][])('rejects client %s, even by the handle\'s owner', async (_label, write) => {
    await seedRegistry()
    await assertFails(write(ctx.alice()))
  })
})

describe('profile username fields are function-only', () => {
  it('profile creation cannot carry username fields', async () => {
    const db = ctx.alice()
    await assertFails(
      db.doc(`users/${ALICE}`).set({
        displayName: 'Alice',
        username: 'alice',
        usernameLower: 'alice',
      }),
    )
    await assertSucceeds(db.doc(`users/${ALICE}`).set({ displayName: 'Alice' }))
  })

  it('profile updates cannot set or change username fields', async () => {
    await testEnv.withSecurityRulesDisabled(async (adminCtx) => {
      await adminCtx.firestore().doc(`users/${ALICE}`).set({
        displayName: 'Alice',
        username: 'alice',
        usernameLower: 'alice',
      })
    })
    const db = ctx.alice()
    await assertFails(
      db.doc(`users/${ALICE}`).set(
        { username: 'newname', usernameLower: 'newname' },
        { merge: true },
      ),
    )
    await assertSucceeds(
      db.doc(`users/${ALICE}`).set({ displayName: 'Alice A.' }, { merge: true }),
    )
  })
})

describe('legacy myGarden collection (transitional)', () => {
  it('signed-in users can read; each user writes only their own document', async () => {
    const db = ctx.alice()
    await assertSucceeds(db.doc(`myGarden/${ALICE}`).set({ plants: [] }))
    await assertSucceeds(ctx.bob().collection('myGarden').get())
    await assertFails(db.doc(`myGarden/${BOB}`).set({ plants: [] }, { merge: true }))
    await assertFails(db.doc(`myGarden/${ALICE}`).delete())
  })
})
