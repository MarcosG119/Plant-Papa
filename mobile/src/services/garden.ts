import {
  collection,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref } from 'firebase/storage';

import { db, functions } from '@/services/firebase';
import { getFirebaseStorage } from '@/config/firebase';
import { plantsCollectionPath } from '@/lib/firestorePaths';

export interface GardenPlant {
  id: string;
  name: string;
  species: string | null;
  /** Storage URL as stored on the document (gs:// or https://). */
  mainImage: string | null;
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
}

export type CareType = 'water' | 'fertilize';

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toText(value: unknown, fallback: string | null = null): string | null {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

// A malformed document must not crash the whole garden list; fields the
// zod schemas guarantee server-side are read defensively here.
function toGardenPlant(id: string, data: Record<string, unknown>): GardenPlant {
  return {
    id,
    name: toText(data.name, 'Unnamed plant')!,
    species: toText(data.species),
    mainImage: toText(data.mainImage),
    lastWateredAt: toDate(data.lastWateredAt),
    lastFertilizedAt: toDate(data.lastFertilizedAt),
  };
}

/**
 * Live subscription over ONLY the signed-in user's plants — the user-scoped
 * layout from the spec means a query cannot over-read another user's garden.
 */
export function subscribeToGarden(
  uid: string,
  onUpdate: (plants: GardenPlant[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, plantsCollectionPath(uid)),
    (snapshot) => onUpdate(snapshot.docs.map((doc) => toGardenPlant(doc.id, doc.data()))),
    (error) => onError(error),
  );
}

interface SerializedTimestamp {
  seconds: number;
}

function serializedTimestampToDate(value: unknown): Date | null {
  if (typeof value !== 'object' || value === null) return null;
  const seconds = (value as SerializedTimestamp).seconds;
  return typeof seconds === 'number' && Number.isFinite(seconds) ? new Date(seconds * 1000) : null;
}

export interface LogCareResult {
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
}

/**
 * Care actions go through the logCare callable, never a direct Firestore
 * write: the function's transaction appends the careLog event and updates the
 * plant's denormalized timestamps atomically, so a rapid double-tap can never
 * leave the two inconsistent.
 */
export async function callLogCare(
  plantId: string,
  type: CareType,
  note?: string,
): Promise<LogCareResult> {
  const callable = httpsCallable<
    { plantId: string; type: CareType; note?: string },
    { lastWateredAt: unknown; lastFertilizedAt: unknown }
  >(functions, 'logCare');
  const result = await callable({ plantId, type, ...(note !== undefined ? { note } : {}) });
  return {
    lastWateredAt: serializedTimestampToDate(result.data.lastWateredAt),
    lastFertilizedAt: serializedTimestampToDate(result.data.lastFertilizedAt),
  };
}

/** gs:// URLs need the Storage SDK to produce a fetchable https URL. */
export async function resolveImageUri(storageUrl: string): Promise<string> {
  if (storageUrl.startsWith('https://')) return storageUrl;
  return getDownloadURL(ref(getFirebaseStorage(), storageUrl));
}
