import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { NoteList, type Note } from '@/components/organisms/NoteList';
import { EmptyState } from '@/components/organisms/EmptyState';
import { ErrorState } from '@/components/organisms/ErrorState';
import { SkeletonList } from '@/components/organisms/SkeletonList';

export interface NotesPanelProps {
  notes: Note[];
  loading: boolean;
  error: string | null;
  actionError: string | null;
  onAdd: (text: string) => Promise<boolean>;
  onSave: (noteId: string, text: string) => Promise<boolean>;
  onRemove: (noteId: string) => Promise<boolean>;
  onRetry: () => void;
}

/**
 * The Notes tab: composer at the bottom, tap a note to edit it in place,
 * hold a note to delete (asks once). Write failures surface at the composer
 * — never silent.
 */
export function NotesPanel({
  notes,
  loading,
  error,
  actionError,
  onAdd,
  onSave,
  onRemove,
  onRetry,
}: NotesPanelProps) {
  const { colors, spacing, typography } = useTheme();
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);

  const submitDraft = () => {
    const text = draft.trim();
    if (text.length === 0) return;
    void onAdd(text).then((ok) => {
      if (ok) setDraft('');
    });
  };

  const confirmDelete = (note: Note) => {
    Alert.alert('Delete note?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void onRemove(note.id) },
    ]);
  };

  if (loading) return <SkeletonList count={3} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;

  return (
    <View style={{ padding: spacing.md, gap: spacing.md }}>
      {actionError ? (
        <Text accessibilityRole="alert" style={[typography.caption, { color: colors.danger }]}>
          {actionError}
        </Text>
      ) : null}
      {notes.length === 0 ? (
        <EmptyState
          title="No notes yet"
          message="Track how this plant changes — new leaves, repotting, anything worth remembering."
        />
      ) : (
        <NoteList
          notes={notes}
          editingNote={editing}
          onPressNote={setEditing}
          onLongPressNote={confirmDelete}
          onSaveEdit={(text) => {
            const noteId = editing?.id;
            setEditing(null);
            if (noteId) void onSave(noteId, text);
          }}
          onCancelEdit={() => setEditing(null)}
        />
      )}
      <View style={{ gap: spacing.sm }}>
        <Input
          label="Add a note"
          value={draft}
          onChangeText={setDraft}
          placeholder="New growth, repotting, worries…"
          multiline
        />
        <Button label="Add note" onPress={submitDraft} disabled={draft.trim().length === 0} />
      </View>
      {notes.length > 0 ? (
        <Text style={[typography.caption, { color: colors.textMuted }]}>
          Tap a note to edit it; hold to delete.
        </Text>
      ) : null}
    </View>
  );
}
