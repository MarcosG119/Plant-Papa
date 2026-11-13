// Typed Firestore client for the plant page. Reads are live subscriptions
// over the signed-in user's own documents; the ONLY network fetch in this
// module is refreshPlantCare, which runs on an explicit user tap — opening a
// plant must make zero Trefle calls (the cached care block is the source).
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { careLogCollectionPath, plantDocPath } from '@/lib/firestorePaths';
import {
  careProfileSchema,
  CURRENT_SCHEMA_VERSION,
  type CareProfile,
} from '@plant-papa/schemas';
import { getPlantDetails, requireUid } from './plants';

export interface PlantPagePlant {
  id: string;
  name: string;
  species: string | null;
  trefleId: number | null;
  /** Storage URL as stored on the document (gs:// or https://). */
  mainImage: string | null;
  care: CareProfile | null;
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
}

export interface CareLogEntry {
  id: string;
  type: 'water' | 'fertilize';
  at: Date;
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null;
}

function toText(value: unknown, fallback: string | null = null): string | null {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function toNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// The care block is validated through the shared zod schema on read; a doc
// written before the schema existed degrades to "no care data", not a crash.
function toCareProfile(value: unknown): CareProfile | null {
  if (typeof value !== 'object' || value === null) return null;
  const parsed = careProfileSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

// A malformed document must not crash the plant page; fields the zod schemas
// guarantee server-side are read defensively here.
function toPlantPagePlant(id: string, data: Record<string, unknown>): PlantPagePlant {
  return {
    id,
    name: toText(data.name, 'Unnamed plant')!,
    species: toText(data.species),
    trefleId: toNumberOrNull(data.trefleId),
    mainImage: toText(data.mainImage),
    care: toCareProfile(data.care),
    lastWateredAt: toDate(data.lastWateredAt),
    lastFertilizedAt: toDate(data.lastFertilizedAt),
  };
}

/** Live subscription over the plant document. `null` means the plant is gone. */
export function subscribeToPlant(
  uid: string,
  plantId: string,
  onPlant: (plant: PlantPagePlant | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(db, plantDocPath(uid, plantId)),
    (snapshot) => {
      onPlant(snapshot.exists() ? toPlantPagePlant(snapshot.id, snapshot.data()) : null);
    },
    (error) => onError(error),
  );
}

/** Recent care history for the plant page timeline, newest first, capped at 20. */
export function subscribeToCareLog(
  uid: string,
  plantId: string,
  onEntries: (entries: CareLogEntry[]) => void,
  onError: (error: Error) => void,
): () => void {
  const recent = query(
    collection(db, careLogCollectionPath(uid, plantId)),
    orderBy('at', 'desc'),
    limit(20),
  );
  return onSnapshot(
    recent,
    (snapshot) => {
      onEntries(
        snapshot.docs.flatMap((docSnap) => {
          const data = docSnap.data();
          const at = toDate(data.at);
          const type = toText(data.type);
          if (!at || (type !== 'water' && type !== 'fertilize')) return [];
          return [{ id: docSnap.id, type, at }];
        }),
      );
    },
    (error) => onError(error),
  );
}

/**
 * The spec's single sanctioned re-fetch: an explicit user tap re-pulls the
 * species care block from Trefle (via the trefleDetails callable) and
 * overwrites the cached block on the plant document.
 */
export async function refreshPlantCare(plantId: string, trefleId: number): Promise<CareProfile> {
  const uid = requireUid();
  const details = await getPlantDetails(trefleId);
  await updateDoc(doc(db, plantDocPath(uid, plantId)), {
    care: details.care,
    schemaVersion: CURRENT_SCHEMA_VERSION,
  });
  return details.care;
}
