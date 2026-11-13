import { useState } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { ChatThread } from '@/components/organisms/ChatThread';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';
import type { UsePlantChatResult } from '@/hooks/usePlantChat';

const MAX_MESSAGE_LENGTH = 2000;

export interface ChatPanelProps {
  chat: UsePlantChatResult;
}

/**
 * The Chat tab: the plant's saved helper thread with a composer at the
 * bottom. Input is disabled while a reply is pending — the assistant's reply
 * arrives through the Firestore snapshot, written server-side by llmChat.
 * A failed send keeps the user's words with a retry affordance.
 */
export function ChatPanel({ chat }: ChatPanelProps) {
  const { colors, spacing, typography } = useTheme();
  const [draft, setDraft] = useState('');

  const submit = () => {
    const text = draft.trim();
    if (text.length === 0 || chat.sending) return;
    setDraft('');
    void chat.send(text);
  };

  if (chat.loading) return <SkeletonList count={3} />;
  if (chat.error) return <ErrorState message={chat.error} onRetry={chat.retrySubscription} />;

  return (
    <View style={{ flex: 1, padding: spacing.md, gap: spacing.sm }}>
      {chat.messages.length === 0 && chat.failedMessages.length === 0 ? (
        <EmptyState
          title="Ask about your plant"
          message="Yellowing leaves, droopy stems, repotting questions — this plant's helper knows its care profile."
        />
      ) : (
        <ChatThread messages={chat.messages} pendingAssistantReply={chat.sending} />
      )}
      {chat.failedMessages.map((failed) => (
        <View
          key={failed.id}
          accessibilityRole="alert"
          style={{
            gap: spacing.xs,
            padding: spacing.sm,
            borderRadius: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.danger,
          }}
        >
          <Text style={[typography.caption, { color: colors.text }]}>“{failed.text}”</Text>
          <Text style={[typography.caption, { color: colors.danger }]}>{failed.error}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label="Retry" variant="secondary" onPress={() => void chat.retry(failed)} />
            <Button label="Dismiss" variant="ghost" onPress={() => chat.dismissFailed(failed)} />
          </View>
        </View>
      ))}
      <Input
        label="Message"
        value={draft}
        onChangeText={setDraft}
        placeholder="Ask about this plant…"
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
      />
      <Button
        label={chat.sending ? 'Thinking…' : 'Send'}
        onPress={submit}
        disabled={draft.trim().length === 0 || chat.sending}
      />
    </View>
  );
}
