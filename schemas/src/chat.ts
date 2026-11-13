import { z } from 'zod'
import { firestoreTimestampSchema } from './common'
import { schemaVersionSchema } from './version'

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
  text: z.string().min(1).max(2000),
  sentAt: firestoreTimestampSchema,
  schemaVersion: schemaVersionSchema,
})

export type ChatMessage = z.infer<typeof chatMessageSchema>
