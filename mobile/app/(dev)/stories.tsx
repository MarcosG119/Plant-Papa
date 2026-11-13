import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { CareButton } from '@/components/atoms/CareButton';
import { Input } from '@/components/atoms/Input';
import { Avatar } from '@/components/atoms/Avatar';
import { Badge } from '@/components/atoms/Badge';
import { Spinner } from '@/components/atoms/Spinner';
import { Tag } from '@/components/atoms/Tag';
import { NoteItem } from '@/components/molecules/NoteItem';
import { ChatBubble } from '@/components/molecules/ChatBubble';
import { CareDateRow } from '@/components/molecules/CareDateRow';
import { PlantCard } from '@/components/organisms/PlantCard';
import { NoteList } from '@/components/organisms/NoteList';
import { PhotoGallery } from '@/components/organisms/PhotoGallery';
import { ChatThread } from '@/components/organisms/ChatThread';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';

// Dev-only gallery: manual preview of every atom, molecule and state organism.
export default function Stories() {
  const { colors, spacing, typography } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}>
        <Text style={[typography.heading, { color: colors.text }]}>Component stories</Text>

        <Section title="Atoms">
          <Text style={[typography.caption, { color: colors.textMuted }]}>Button variants</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Button label="Primary" onPress={() => {}} />
            <Button label="Secondary" variant="secondary" onPress={() => {}} />
            <Button label="Ghost" variant="ghost" onPress={() => {}} />
            <Button label="Loading" loading />
            <Button label="Disabled" disabled />
          </View>
          <Text style={[typography.caption, { color: colors.textMuted }]}>Care buttons</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <CareButton kind="water" lastAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} onPress={() => {}} />
            </View>
            <View style={{ flex: 1 }}>
              <CareButton kind="fertilize" lastAt={null} onPress={() => {}} />
            </View>
          </View>
          <Input label="Email" placeholder="you@example.com" />
          <Input label="Password" placeholder="••••••••" error="At least 8 characters" />
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Avatar name="Marcos Garcia" />
            <Avatar name="Monty" />
            <Badge text="needs water" tone="warning" />
            <Badge text="happy" tone="success" />
            <Tag text="Monstera adansonii" />
            <Spinner />
          </View>
        </Section>

        <Section title="Molecules">
          <NoteItem text="New leaf unfurling." updatedAt={new Date(Date.now() - 2 * 60 * 60 * 1000)} />
          <View style={{ gap: spacing.sm }}>
            <ChatBubble role="user" text="Why are the leaf tips browning?" sentAt={new Date(Date.now() - 60 * 1000)} />
            <ChatBubble role="assistant" text="Usually underwatering or dry air. Check the top inch of soil." sentAt={new Date()} />
            <ChatBubble role="assistant" text="" pending />
          </View>
          <CareDateRow label="last watered" at={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)} />
          <CareDateRow label="last fed" at={null} />
        </Section>

        <Section title="Organisms">
          <PlantCard
            name="Monty"
            species="Monstera adansonii"
            lastWateredAt={new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)}
            lastFertilizedAt={new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)}
            onWater={() => {}}
            onFertilize={() => {}}
            onPress={() => {}}
          />
          <PlantCard
            name="Fern"
            species="Boston fern"
            lastWateredAt={null}
            lastFertilizedAt={new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)}
          />
          <EmptyState
            title="Add your first plant"
            message="Identify by photo or search by name."
            actionLabel="Add a plant"
            onAction={() => {}}
          />
          <ErrorState message="Couldn't load your garden." onRetry={() => {}} />
          <SkeletonList count={2} />
          <NoteList
            notes={[
              { id: 'n1', text: 'New leaf unfurling.', updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
              { id: 'n2', text: 'Moved closer to the window.', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            ]}
          />
          <PhotoGallery
            onAddPhoto={() => {}}
            photos={[
              { id: 'p1', uri: 'https://picsum.photos/seed/plant1/300', takenAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
              { id: 'p2', uri: 'https://picsum.photos/seed/plant2/300', takenAt: new Date() },
            ]}
          />
          <ChatThread
            pendingAssistantReply
            messages={[
              { id: 'm1', role: 'user', text: 'Why are the leaf tips browning?', sentAt: new Date(Date.now() - 60 * 1000) },
            ]}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[typography.subheading, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}
