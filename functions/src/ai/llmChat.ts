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
  let chatId: string
  const chatSnap = await chatsCollection.limit(1).get()
  if (chatSnap.empty) {
    const chatDoc = {
      createdAt: Timestamp.fromMillis(now().getTime()),
      lastMessageAt: Timestamp.fromMillis(now().getTime()),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    }
    assertValid(chatSchema, chatDoc)
    const created = await chatsCollection.add(chatDoc)
    chatId = created.id
  } else {
    chatId = chatSnap.docs[0].id
  }

  await assertUnderRateLimit(db, uid, input.plantId, chatId, now())

  const messagesCollection = db.collection(
    chatMessagesCollectionPath(uid, input.plantId, chatId),
  )

  // Store the user's words first — a provider failure must never lose them.
  const userMessage = {
    role: 'user' as const,
    text: input.text,
    sentAt: Timestamp.fromMillis(now().getTime()),
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

  const assistantMessage = {
    role: 'assistant' as const,
    text: reply.text,
    sentAt: Timestamp.fromMillis(now().getTime()),
    schemaVersion: CURRENT_SCHEMA_VERSION,
  }
  assertValid(chatMessageSchema, assistantMessage)
  const assistantDoc = await messagesCollection.add(assistantMessage)
  await chatsCollection
    .doc(chatId)
    .update({ lastMessageAt: Timestamp.fromMillis(now().getTime()) })

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
