// Per-plant helper chat. The conversation is written server-side by the
// llmChat callable (the client never sees the LLM API); the client renders
// the thread from Firestore snapshots and calls the callable to send.
import { collection, limit, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { FunctionsError, httpsCallable } from 'firebase/functions';

import { getFirebaseFunctions } from '@/config/firebase';
import { db } from '@/services/firebase';
import { chatMessagesCollectionPath, chatsCollectionPath } from '@/lib/firestorePaths';

export interface ChatMessageView {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sentAt: Date | null;
}

export type SendPlantMessageResult = { ok: true } | { ok: false; message: string };

const MAX_MESSAGE_LENGTH = 2000;

function toTimestampDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

// A malformed message doc degrades to a skipped bubble, not a crashed thread.
function toChatMessage(id: string, data: Record<string, unknown>): ChatMessageView | null {
  const role = data.role === 'user' || data.role === 'assistant' ? data.role : null;
  const text = typeof data.text === 'string' && data.text.length > 0 ? data.text : null;
  if (!role || !text) return null;
  return { id, role, text, sentAt: toTimestampDate(data.sentAt) };
}

/**
 * Live message history for the plant's chat. One chat doc exists per plant
 * (the callable creates it lazily); until then the thread is simply empty.
 */
export function subscribeToChatMessages(
  uid: string,
  plantId: string,
  onMessages: (messages: ChatMessageView[]) => void,
  onError: (error: Error) => void,
): () => void {
  let unsubscribeMessages: (() => void) | null = null;

  const unsubscribeChats = onSnapshot(
    query(collection(db, chatsCollectionPath(uid, plantId)), limit(1)),
    (chatsSnap) => {
      unsubscribeMessages?.();
      unsubscribeMessages = null;
      if (chatsSnap.empty) {
        onMessages([]);
        return;
      }
      const chatId = chatsSnap.docs[0].id;
      unsubscribeMessages = onSnapshot(
        query(
          collection(db, chatMessagesCollectionPath(uid, plantId, chatId)),
          orderBy('sentAt', 'asc'),
        ),
        (messagesSnap) => {
          onMessages(
            messagesSnap.docs.flatMap((docSnap) => {
              const message = toChatMessage(docSnap.id, docSnap.data());
              return message ? [message] : [];
            }),
          );
        },
        (error) => onError(error),
      );
    },
    (error) => onError(error),
  );

  return () => {
    unsubscribeMessages?.();
    unsubscribeChats();
  };
}

/**
 * Sends a message through the llmChat callable. Both the user's words and
 * the assistant reply are persisted server-side; the thread updates via the
 * snapshot, so the result carries only success or a friendly failure.
 */
export async function sendPlantMessage(
  uid: string,
  plantId: string,
  text: string,
): Promise<SendPlantMessageResult> {
  const trimmed = text.trim();
  if (trimmed.length === 0) return { ok: false, message: 'Write a message first.' };
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, message: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.` };
  }
  const callable = httpsCallable<{ plantId: string; text: string }, { messageId: string }>(
    getFirebaseFunctions(),
    'llmChat',
  );
  try {
    await callable({ plantId, text: trimmed });
    return { ok: true };
  } catch (error) {
    // The callable's typed error surface: resource-exhausted carries
    // 'chat/rate-limited' (30 messages/hour guardrail).
    if (error instanceof FunctionsError) {
      if (error.code === 'resource-exhausted' || error.message === 'chat/rate-limited') {
        return {
          ok: false,
          message: "You've sent a lot of messages to this plant — try again in a little while.",
        };
      }
      if (error.code === 'invalid-argument') {
        return { ok: false, message: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.` };
      }
      if (error.code === 'not-found') {
        return { ok: false, message: 'This plant no longer exists.' };
      }
    }
    return { ok: false, message: 'Could not send the message. Check your connection and try again.' };
  }
}
