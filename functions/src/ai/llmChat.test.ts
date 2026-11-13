import { describe, expect, it, afterEach } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'
import {
  chatMessagesCollectionPath,
  chatsCollectionPath,
  plantPath,
} from '../lib/paths'
import { llmChatImpl, type LlmChatDeps } from './llmChat'
import { createTestDb, destroyTestDb, type TestDb } from '../test/emulator'

// Runs under the Firestore emulator (`npm run test:emulator`). The provider
// is a stub — these tests cover what llmChat itself owns: persistence order,
// rate limiting, and the context it hands the provider.

const BASE_TIME = new Date('2026-11-13T12:00:00Z')

function makeDeps(db: TestDb['db'], now = BASE_TIME): LlmChatDeps {
  return {
    db,
    now: () => now,
    makeProviderFn: () => ({
      name: 'test',
      chat: async (req) => ({
        text: `echo:${req.systemPrompt.length}`,
        provider: 'test',
        model: 'test-model',
      }),
    }),
  }
}

async function seedPlant(db: TestDb['db']): Promise<void> {
  await db.doc(plantPath('uid-a', 'plant-1')).set({
    name: 'Monty',
    species: 'Monstera adansonii',
    schemaVersion: 1,
  })
}

describe('llmChat (emulator)', () => {
  let handle: TestDb | undefined

  afterEach(async () => {
    if (handle) await destroyTestDb(handle)
    handle = undefined
  })

  it('creates the chat lazily and persists the user message then the assistant reply', async () => {
    handle = await createTestDb(`test-chat-${Date.now()}`)
    const { db } = handle
    await seedPlant(db)

    await llmChatImpl(makeDeps(db), 'uid-a', { plantId: 'plant-1', text: 'Why are leaves yellowing?' })

    const chats = await db.collection(chatsCollectionPath('uid-a', 'plant-1')).get()
    expect(chats.size).toBe(1)
    const chatId = chats.docs[0].id
    expect(chats.docs[0].data().lastMessageAt).toBeInstanceOf(Timestamp)

    const messages = await db
      .collection(chatMessagesCollectionPath('uid-a', 'plant-1', chatId))
      .orderBy('sentAt')
      .get()
    expect(messages.size).toBe(2)
    expect(messages.docs[0].data().role).toBe('user')
    expect(messages.docs[0].data().text).toBe('Why are leaves yellowing?')
    expect(messages.docs[1].data().role).toBe('assistant')
  })

  it('reuses the one chat document and includes history in the provider context', async () => {
    handle = await createTestDb(`test-chat-${Date.now()}`)
    const { db } = handle
    await seedPlant(db)

    let seenMessages: { role: string; text: string }[] = []
    const deps: LlmChatDeps = {
      db,
      now: () => BASE_TIME,
      makeProviderFn: () => ({
        name: 'test',
        chat: async (req) => {
          seenMessages = req.messages
          return { text: 'ok', provider: 'test', model: 'test-model' }
        },
      }),
    }

    await llmChatImpl(deps, 'uid-a', { plantId: 'plant-1', text: 'first question' })
    await llmChatImpl(deps, 'uid-a', { plantId: 'plant-1', text: 'second question' })

    const chats = await db.collection(chatsCollectionPath('uid-a', 'plant-1')).get()
    expect(chats.size).toBe(1)

    // The second call's context carries the first exchange, oldest first.
    expect(seenMessages.map((m) => `${m.role}:${m.text}`)).toEqual([
      'user:first question',
      'assistant:ok',
      'user:second question',
    ])
  })

  it('rejects message 31 in an hour with chat/rate-limited', async () => {
    handle = await createTestDb(`test-chat-${Date.now()}`)
    const { db } = handle
    await seedPlant(db)

    await llmChatImpl(makeDeps(db), 'uid-a', { plantId: 'plant-1', text: 'message 1' })
    // The first call wrote 1 user message; top up to 30 inside the window.
    const chats = await db.collection(chatsCollectionPath('uid-a', 'plant-1')).get()
    const chatId = chats.docs[0].id
    const messages = db.collection(chatMessagesCollectionPath('uid-a', 'plant-1', chatId))
    for (let i = 2; i <= 30; i += 1) {
      await messages.add({
        role: 'user',
        text: `message ${i}`,
        sentAt: Timestamp.fromMillis(BASE_TIME.getTime() - i * 60_000),
        schemaVersion: 1,
      })
    }

    await expect(
      llmChatImpl(makeDeps(db), 'uid-a', { plantId: 'plant-1', text: 'one too many' }),
    ).rejects.toThrow('chat/rate-limited')

    // The rejected message must not have been persisted.
    const all = await messages.where('role', '==', 'user').count().get()
    expect(all.data().count).toBe(30)
  })

  it('rejects chat for a plant the caller does not own', async () => {
    handle = await createTestDb(`test-chat-${Date.now()}`)
    const { db } = handle
    await seedPlant(db)

    await expect(
      llmChatImpl(makeDeps(db), 'uid-b', { plantId: 'plant-1', text: 'hello?' }),
    ).rejects.toThrow('Plant not found.')
  })
})
