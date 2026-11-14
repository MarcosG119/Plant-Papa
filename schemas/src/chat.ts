import { z } from 'zod'
import { firestoreTimestampSchema } from './common'
import { schemaVersionSchema } from './version'

// One cap, validated identically on the client, in llmChat's zod parse, and in
// the persisted-message schema — three max(2000)s drifted into one constant.
export const MAX_MESSAGE_LENGTH = 2000

// users/{uid}/plants/{plantId}/chats/{chatId} — created lazily on first
// message, one per plant.
export const chatSchema = z.object({
  createdAt: firestoreTimestampSchema,
  lastMessageAt: firestoreTimestampSchema,
  title: z.string().min(1).max(200).optional(),
  schemaVersion: schemaVersionSchema,
})

export type Chat = z.infer<typeof chatSchema>

// users/{uid}/plants/{plantId}/chats/{chatId}/messages/{msgId} — the assistant
// reply is written server-side; input length matches sendPlantMessage's cap.
export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().min(1).max(MAX_MESSAGE_LENGTH),
  sentAt: firestoreTimestampSchema,
  // Idempotency key: the client stamps every send (retries reuse the same
  // value) so llmChat can recognize a duplicated attempt after a timeout.
  clientRequestId: z.string().min(1).max(64).optional(),
  schemaVersion: schemaVersionSchema,
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
