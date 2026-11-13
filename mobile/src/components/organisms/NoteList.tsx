import { FlatList, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';
import { NoteItem } from '@/components/molecules/NoteItem';

export interface Note {
  id: string;
  text: string;
  updatedAt: Date;
}

export interface NoteListProps {
  notes: Note[];
  onPressNote?: (note: Note) => void;
  style?: StyleProp<ViewStyle>;
}

/** Chronological note list; edit-in-place behavior arrives with the plant page. */
export function NoteList({ notes, onPressNote, style }: NoteListProps) {
  const { spacing } = useTheme();

  return (
    <FlatList
      data={notes}
      keyExtractor={(note) => note.id}
      renderItem={({ item }) => (
        <NoteItem text={item.text} updatedAt={item.updatedAt} onPress={() => onPressNote?.(item)} />
      )}
      ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      style={style}
    />
  );
}
