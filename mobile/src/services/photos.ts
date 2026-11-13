// Growth photos for the plant page — client-direct Storage uploads (the SDK
// handles auth tokens; rules verify ownership from the path and metadata),
// and a Firestore photo doc per upload. Photos are the progress record, so
// every photo carries its takenAt date.
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable } from 'firebase/storage';

import { db } from '@/services/firebase';
import { getFirebaseStorage } from '@/config/firebase';
import { photosCollectionPath, plantDocPath } from '@/lib/firestorePaths';
import { photoSchema, stampSchemaVersion } from '@plant-papa/schemas';
import { toBlob } from './storage';

export interface PlantPhoto {
  id: string;
  /** Storage URL as stored on the document (gs://), resolved by the hook. */
  url: string;
  takenAt: Date;
  caption: string | null;
}

/** gs:// object path for a plant's photo — the layout the rules expect. */
export function plantPhotoStoragePath(uid: string, plantId: string): string {
  return `users/${uid}/plants/${plantId}/photos`;
}

function toTimestampDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

// A malformed photo doc degrades to a skipped tile, not a crashed gallery.
function toPlantPhoto(id: string, data: Record<string, unknown>): PlantPhoto | null {
  const url = toText(data.url);
  const takenAt = toTimestampDate(data.takenAt);
  if (!url || !takenAt) return null;
  return { id, url, takenAt, caption: toText(data.caption) };
}

/** Live photo list, newest first — growth reads top to bottom. */
export function subscribeToPhotos(
  uid: string,
  plantId: string,
  onPhotos: (photos: PlantPhoto[]) => void,
  onError: (error: Error) => void,
): () => void {
  const ordered = query(
    collection(db, photosCollectionPath(uid, plantId)),
    orderBy('takenAt', 'desc'),
  );
  return onSnapshot(
    ordered,
    (snapshot) => {
      onPhotos(
        snapshot.docs.flatMap((docSnap) => {
          const photo = toPlantPhoto(docSnap.id, docSnap.data());
          return photo ? [photo] : [];
        }),
      );
    },
    (error) => onError(error),
  );
}

/**
 * Uploads a camera/library image to the plant's own Storage tree with
 * visible progress, then writes the photo document. Resolves when both are
 * committed — the grid updates through the snapshot.
 */
export async function uploadPlantPhoto(
  uid: string,
  plantId: string,
  localUri: string,
  onProgress: (fraction: number) => void,
): Promise<void> {
  const objectPath = `${plantPhotoStoragePath(uid, plantId)}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(getFirebaseStorage(), objectPath);
  const blob = await toBlob(localUri);
  const task = uploadBytesResumable(storageRef, blob, {
    contentType: 'image/jpeg',
    customMetadata: { uid, plantId },
  });
  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => onProgress(snapshot.bytesTransferred / snapshot.totalBytes),
      (error) => reject(error),
      () => resolve(),
    );
  });
  const data = photoSchema.parse(
    stampSchemaVersion({
      url: `gs://${storageRef.bucket}/${objectPath}`,
      // Firestore Timestamp, not a plain Date — see addNote's note on
      // firestoreTimestampSchema's { seconds, nanoseconds } shape.
      takenAt: Timestamp.now(),
    }),
  );
  await addDoc(collection(db, photosCollectionPath(uid, plantId)), data);
}

/** Sets a gallery photo as the plant's cover (card image everywhere). */
export async function setPlantCover(
  uid: string,
  plantId: string,
  photoUrl: string,
): Promise<void> {
  await updateDoc(doc(db, plantDocPath(uid, plantId)), { mainImage: photoUrl });
}
