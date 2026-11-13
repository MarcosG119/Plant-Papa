import { useState } from 'react';
import { FlatList, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { NoteItem } from '@/components/molecules/NoteItem';
import { Input } from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';

export interface Note {
  id: string;
  text: string;
  updatedAt: Date;
}

export interface NoteListProps {
  notes: Note[];
  onPressNote?: (note: Note) => void;
  /** The note currently in edit mode; rendered as an inline editor row. */
  editingNote?: Note | null;
  onSaveEdit?: (text: string) => void;
  onCancelEdit?: () => void;
  onLongPressNote?: (note: Note) => void;
  style?: StyleProp<ViewStyle>;
}

/** One note row in edit mode: text input with save/cancel inline. */
function NoteEditRow({
  initialText,
  onSave,
  onCancel,
}: {
  initialText: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}) {
  const { spacing } = useTheme();
  const [text, setText] = useState(initialText);

  return (
    <View style={{ gap: spacing.sm }}>
      <Input label="Edit note" value={text} onChangeText={setText} multiline autoFocus />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Button label="Save" onPress={() => onSave(text)} disabled={text.trim().length === 0} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="secondary" onPress={onCancel} />
        </View>
      </View>
    </View>
  );
}

/** Chronological note list with tap-to-edit-in-place behavior. */
export function NoteList({
  notes,
  onPressNote,
  editingNote = null,
  onSaveEdit,
  onCancelEdit,
  onLongPressNote,
  style,
}: NoteListProps) {
  const { spacing } = useTheme();

  return (
    <FlatList
      data={notes}
      keyExtractor={(note) => note.id}
      scrollEnabled={false}
      renderItem={({ item }) =>
        editingNote && item.id === editingNote.id ? (
          <NoteEditRow
            initialText={editingNote.text}
            onSave={(text) => onSaveEdit?.(text)}
            onCancel={() => onCancelEdit?.()}
          />
        ) : (
          <NoteItem
            text={item.text}
            updatedAt={item.updatedAt}
            onPress={() => onPressNote?.(item)}
            onLongPress={onLongPressNote ? () => onLongPressNote(item) : undefined}
          />
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      style={style}
    />
  );
}
