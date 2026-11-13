import { useCallback, useEffect, useState } from 'react';

import {
  addNote,
  deleteNote,
  subscribeToNotes,
  updateNote,
  type PlantNote,
} from '@/services/notes';

export interface UseNotesResult {
  notes: PlantNote[];
  /** True until the first snapshot (or its error) lands. */
  loading: boolean;
  error: string | null;
  /** A failed add/save/delete — never swallowed, shown at the composer. */
  actionError: string | null;
  add: (text: string) => Promise<boolean>;
  save: (noteId: string, text: string) => Promise<boolean>;
  remove: (noteId: string) => Promise<boolean>;
  retry: () => void;
}

/**
 * Plant notes state over a live Firestore snapshot. Writes are client-direct
 * (schema-validated in the service); failures roll back via the snapshot and
 * surface as actionError.
 */
export function useNotes(uid: string | null | undefined, plantId: string): UseNotesResult {
  const [notes, setNotes] = useState<PlantNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid || !plantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeToNotes(
      uid,
      plantId,
      (next) => {
        setNotes(next);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [uid, plantId, attempt]);

  const add = useCallback(
    async (text: string) => {
      if (!uid) return false;
      setActionError(null);
      try {
        await addNote(uid, plantId, text);
        return true;
      } catch {
        setActionError('Could not add the note. Check your connection and try again.');
        return false;
      }
    },
    [uid, plantId],
  );

  const save = useCallback(
    async (noteId: string, text: string) => {
      if (!uid) return false;
      setActionError(null);
      try {
        await updateNote(uid, plantId, noteId, text);
        return true;
      } catch {
        setActionError('Could not save the note. Check your connection and try again.');
        return false;
      }
    },
    [uid, plantId],
  );

  const remove = useCallback(
    async (noteId: string) => {
      if (!uid) return false;
      setActionError(null);
      try {
        await deleteNote(uid, plantId, noteId);
        return true;
      } catch {
        setActionError('Could not delete the note. Check your connection and try again.');
        return false;
      }
    },
    [uid, plantId],
  );

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { notes, loading, error, actionError, add, save, remove, retry };
}
