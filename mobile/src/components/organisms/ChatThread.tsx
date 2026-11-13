import { FlatList, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { ChatBubble } from '@/components/molecules/ChatBubble';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  sentAt: Date | null;
}

export interface ChatThreadProps {
  messages: ChatMessage[];
  /** Shows the pending assistant bubble while sendPlantMessage is in flight. */
  pendingAssistantReply?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PENDING_MESSAGE_ID = '__pending__';

/** Saved plant-helper thread, oldest to newest, autoscrolling to the latest message. */
export function ChatThread({ messages, pendingAssistantReply = false, style }: ChatThreadProps) {
  const { spacing } = useTheme();

  const data = pendingAssistantReply
    ? [...messages, { id: PENDING_MESSAGE_ID, role: 'assistant' as const, text: '', sentAt: null }]
    : messages;

  return (
    <FlatList
      data={data}
      keyExtractor={(message) => message.id}
      renderItem={({ item }) =>
        item.id === PENDING_MESSAGE_ID ? (
          <ChatBubble role="assistant" text="" pending />
        ) : (
          <ChatBubble role={item.role} text={item.text} sentAt={item.sentAt} />
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      contentContainerStyle={[{ padding: spacing.md }, style]}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 0,
      }}
    />
  );
}
