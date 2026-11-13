import type { Firestore } from 'firebase-admin/firestore'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { onCall } from 'firebase-functions/v2/https'
import { z } from 'zod'
import {
  chatMessageSchema,
  chatSchema,
  CURRENT_SCHEMA_VERSION,
  type CareProfile,
} from '@plant-papa/schemas'
import { invalidArgument, notFound, resourceExhausted } from '../lib/errors'
import { requireAuth } from '../lib/guards'
import {
  chatMessagesCollectionPath,
  chatsCollectionPath,
  plantPath,
} from '../lib/paths'
import { assertValid } from '../lib/validate'
import { makeProvider } from './providers/factory'
import { buildSystemPrompt } from './prompt'
import type { ChatRequest } from './types'

const inputSchema = z.object({
  plantId: z.string().min(1),
  text: z.string().min(1).max(2000),
})

export type LlmChatInput = z.infer<typeof inputSchema>

// Cost guardrail from the core spec: 30 user messages per hour per chat.
const RATE_LIMIT_PER_HOUR = 30

// One chat document per plant, under a deterministic id. Two concurrent
// first-sends then race on create() — atomic server-side — instead of both
// seeing an empty collection and adding two chat documents that would split
// the thread (the client subscribes to an arbitrary one).
const PRIMARY_CHAT_ID = 'primary'

async function assertUnderRateLimit(
  db: Firestore,
  uid: string,
  plantId: string,
  chatId: string,
  now: Date,
): Promise<void> {
  const hourAgo = Timestamp.fromMillis(now.getTime() - 60 * 60 * 1000)
  const recent = await db
    .collection(chatMessagesCollectionPath(uid, plantId, chatId))
    .where('role', '==', 'user')
    .where('sentAt', '>=', hourAgo)
    .count()
    .get()
  if (recent.data().count >= RATE_LIMIT_PER_HOUR) {
    throw resourceExhausted('chat/rate-limited')
  }
}

export interface LlmChatDeps {
  db: Firestore
  makeProviderFn?: typeof makeProvider
  now?: () => Date
}

export async function llmChatImpl(
  deps: LlmChatDeps,
  uid: string,
  input: LlmChatInput,
): Promise<{ messageId: string; userMessageId: string }> {
  const db = deps.db
  const now = deps.now ?? (() => new Date())
  const plantRef = db.doc(plantPath(uid, input.plantId))
  const plantSnap = await plantRef.get()
  if (!plantSnap.exists) {
    throw notFound('Plant not found.')
  }
  const plant = plantSnap.data()
  const species = (plant?.species as string | null) ?? (plant?.name as string)

  // One chat document per plant, created lazily on first message.
  const chatsCollection = db.collection(chatsCollectionPath(uid, input.plantId))
  const chatId = PRIMARY_CHAT_ID
  const chatRef = chatsCollection.doc(chatId)
  const chatSnap = await chatRef.get()
  if (!chatSnap.exists) {
    const nowMillis = now().getTime()
    const chatDoc = {
      createdAt: Timestamp.fromMillis(nowMillis),
      lastMessageAt: Timestamp.fromMillis(nowMillis),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }
    assertValid(chatSchema, chatDoc)
    try {
      await chatRef.create(chatDoc)
    } catch (err) {
      // A concurrent send may have won the create race. Tolerate only that
      // case — if the chat still doesn't exist, this is a real failure.
      if (!(await chatRef.get()).exists) {
        throw err
      }
    }
  }

  await assertUnderRateLimit(db, uid, input.plantId, chatId, now())

  const messagesCollection = db.collection(
    chatMessagesCollectionPath(uid, input.plantId, chatId),
  )

  // One read of the clock per send, bumped past the newest existing message:
  // even when two sends land in the same millisecond, messages order
  // strictly by sentAt and no reply can sort above the question it answers.
  const newestSnap = await messagesCollection.orderBy('sentAt', 'desc').limit(1).get()
  const newestMillis = newestSnap.empty
    ? null
    : (newestSnap.docs[0].data().sentAt as Timestamp).toMillis()
  const userSentAtMillis = Math.max(now().getTime(), (newestMillis ?? 0) + 1)

  // Store the user's words first — a provider failure must never lose them.
  const userMessage = {
    role: 'user' as const,
    text: input.text,
    sentAt: Timestamp.fromMillis(userSentAtMillis),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
  assertValid(chatMessageSchema, userMessage)
  const userDoc = await messagesCollection.add(userMessage)

  const history = await messagesCollection
    .orderBy('sentAt', 'desc')
    .limit(12)
    .get()
  const context = history.docs
    .reverse()
    .map((doc) => {
      const data = doc.data()
      return { role: data.role as 'user' | 'assistant', text: data.text as string }
    })

  const chatRequest: ChatRequest = {
    systemPrompt: buildSystemPrompt(
      species,
      (plant?.care as CareProfile | null) ?? null,
    ),
    messages: context,
  }
  const makeProviderFn = deps.makeProviderFn ?? makeProvider
  const reply = await makeProviderFn().chat(chatRequest)

  // The reply must order strictly after the user's message even when the
  // provider answers within the same millisecond — clients render by sentAt.
  const assistantSentAtMillis = Math.max(now().getTime(), userSentAtMillis + 1)
  const assistantMessage = {
    role: 'assistant' as const,
    text: reply.text,
    sentAt: Timestamp.fromMillis(assistantSentAtMillis),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
  assertValid(chatMessageSchema, assistantMessage)
  const assistantDoc = await messagesCollection.add(assistantMessage)
  await chatsCollection
    .doc(chatId)
    .update({ lastMessageAt: Timestamp.fromMillis(assistantSentAtMillis) })

  return { messageId: assistantDoc.id, userMessageId: userDoc.id }
}

export const llmChat = onCall(
  { secrets: ['OPENAI_API_KEY'] },
  async (request) => {
    const uid = requireAuth(request)
    const parsed = inputSchema.safeParse(request.data)
    if (!parsed.success) {
      throw invalidArgument(
        'Expected { plantId: string, text: string (≤2000 chars) }.',
      )
    }
    return llmChatImpl({ db: getFirestore() }, uid, parsed.data)
  },
)
