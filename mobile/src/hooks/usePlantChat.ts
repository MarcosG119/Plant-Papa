import { useCallback, useEffect, useState } from 'react';

import {
  sendPlantMessage,
  subscribeToChatMessages,
  type ChatMessageView,
} from '@/services/chat';

/** A message the callable failed to persist — kept on screen with a retry. */
export interface FailedMessage {
  id: string;
  text: string;
  error: string;
}

export interface UsePlantChatResult {
  messages: ChatMessageView[];
  /** True until the first snapshot (or its error) lands. */
  loading: boolean;
  error: string | null;
  /** A send is in flight; the composer stays disabled until it resolves. */
  sending: boolean;
  failedMessages: FailedMessage[];
  send: (text: string) => Promise<void>;
  retry: (failed: FailedMessage) => Promise<void>;
  dismissFailed: (failed: FailedMessage) => void;
  retrySubscription: () => void;
}

/**
 * Chat state: a live subscription to the plant's saved conversation plus
 * sends through the llmChat callable. A failed send keeps the user's words
 * on screen (retry affordance) — the user's words are never lost.
 */
export function usePlantChat(
  uid: string | null | undefined,
  plantId: string,
): UsePlantChatResult {
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [failedMessages, setFailedMessages] = useState<FailedMessage[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid || !plantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeToChatMessages(
      uid,
      plantId,
      (next) => {
        setMessages(next);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [uid, plantId, attempt]);

  const removeFailed = useCallback((id: string) => {
    setFailedMessages((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!uid || sending) return;
      setSending(true);
      try {
        const result = await sendPlantMessage(uid, plantId, text);
        if (!result.ok) {
          setFailedMessages((prev) => [
            ...prev,
            { id: `failed-${Date.now()}`, text: text.trim(), error: result.message },
          ]);
        }
      } finally {
        setSending(false);
      }
    },
    [uid, plantId, sending],
  );

  const retry = useCallback(
    async (failed: FailedMessage) => {
      removeFailed(failed.id);
      await send(failed.text);
    },
    [removeFailed, send],
  );

  const dismissFailed = useCallback(
    (failed: FailedMessage) => removeFailed(failed.id),
    [removeFailed],
  );
  const retrySubscription = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    messages,
    loading,
    error,
    sending,
    failedMessages,
    send,
    retry,
    dismissFailed,
    retrySubscription,
  };
}
