// Notes CRUD for the plant page — client-direct Firestore writes scoped to
// the signed-in user's own plant. Every write validates through the shared
// zod schema and stamps schemaVersion, so ad-hoc document shapes are
// impossible; no callable is needed because notes touch no secret.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { noteDocPath, notesCollectionPath } from '@/lib/firestorePaths';
import { noteSchema, stampSchemaVersion } from '@plant-papa/schemas';

export interface PlantNote {
  id: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

function toTimestampDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

// A malformed note degrades to a skipped row, not a crashed list.
function toPlantNote(id: string, data: Record<string, unknown>): PlantNote | null {
  const text = toText(data.text);
  const createdAt = toTimestampDate(data.createdAt);
  const updatedAt = toTimestampDate(data.updatedAt);
  if (!text || !createdAt || !updatedAt) return null;
  return { id, text, createdAt, updatedAt };
}

/**
 * Live note list ordered by updatedAt (newest first) so an edit visibly
 * reorders — the verification table's "list reorders correctly after edit".
 */
export function subscribeToNotes(
  uid: string,
  plantId: string,
  onNotes: (notes: PlantNote[]) => void,
  onError: (error: Error) => void,
): () => void {
  const ordered = query(
    collection(db, notesCollectionPath(uid, plantId)),
    orderBy('updatedAt', 'desc'),
  );
  return onSnapshot(
    ordered,
    (snapshot) => {
      onNotes(
        snapshot.docs.flatMap((docSnap) => {
          const note = toPlantNote(docSnap.id, docSnap.data());
          return note ? [note] : [];
        }),
      );
    },
    (error) => onError(error),
  );
}

export async function addNote(uid: string, plantId: string, text: string): Promise<void> {
  // Firestore Timestamp values, not plain Dates: the shared schema's
  // firestoreTimestampSchema expects the { seconds, nanoseconds } shape a
  // Date does not satisfy, so the parse would throw before any write.
  const now = Timestamp.now();
  const data = stampSchemaVersion({ text: text.trim(), createdAt: now, updatedAt: now });
  // Validate, but write the original object: zod's parse returns a
  // plain-object copy that de-instantiates Firestore Timestamps (see
  // uploadPlantPhoto) — the parsed output would store the timestamps as
  // maps and the reader would silently drop every note.
  noteSchema.parse(data);
  await addDoc(collection(db, notesCollectionPath(uid, plantId)), data);
}

export async function updateNote(
  uid: string,
  plantId: string,
  noteId: string,
  text: string,
): Promise<void> {
  const data = noteSchema.pick({ text: true }).parse({ text: text.trim() });
  await updateDoc(doc(db, noteDocPath(uid, plantId, noteId)), {
    text: data.text,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteNote(
  uid: string,
  plantId: string,
  noteId: string,
): Promise<void> {
  await deleteDoc(doc(db, noteDocPath(uid, plantId, noteId)));
}
