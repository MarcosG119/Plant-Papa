// Typed clients over the Cloud Functions callables and Firestore for the
// add-plant flow. Screens never call httpsCallable directly — this module is
// the seam. Wire shapes mirror the callable contracts in functions/src/plants/
// (the functions are the source of truth for these responses).
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

import type { CareProfile } from '@plant-papa/schemas';
import { plantSchema, stampSchemaVersion } from '@plant-papa/schemas';

import { getDb, getFirebaseAuth, getFirebaseFunctions } from '@/config/firebase';

export interface PlantSummary {
  trefleId: number;
  commonName: string | null;
  scientificName: string;
  imageUrl: string | null;
  familyCommonName: string | null;
}

export interface PlantDetails {
  trefleId: number;
  commonName: string | null;
  scientificName: string;
  imageUrl: string | null;
  familyCommonName: string | null;
  care: CareProfile;
}

export interface IdentifiedCandidate {
  scientificName: string;
  commonName: string | null;
  family: string | null;
  score: number;
  imageUrl: string | null;
  trefleId: number | null;
  care: CareProfile | null;
}

interface SearchResultPayload {
  results: PlantSummary[];
  page: number;
  hasNext: boolean;
}

interface DetailsPayload {
  trefleId: number;
  commonName: string | null;
  scientificName: string;
  imageUrl: string | null;
  familyCommonName: string | null;
  care: CareProfile;
}

interface IdentifyPayload {
  candidates: IdentifiedCandidate[];
}

/** The signed-in user every write and callable is scoped to. */
export function requireUid(): string {
  const uid = getFirebaseAuth().currentUser?.uid;
  if (!uid) {
    throw new Error('auth/unauthenticated');
  }
  return uid;
}

export async function searchPlants(q: string, page = 1): Promise<SearchResultPayload> {
  const callable = httpsCallable<{ q: string; page?: number }, SearchResultPayload>(
    getFirebaseFunctions(),
    'trefleSearch',
  );
  const result = await callable({ q, page });
  return result.data;
}

export async function getPlantDetails(trefleId: number): Promise<PlantDetails> {
  const callable = httpsCallable<{ trefleId: number }, DetailsPayload>(
    getFirebaseFunctions(),
    'trefleDetails',
  );
  const result = await callable({ trefleId });
  return result.data;
}

/**
 * Identifies a plant from photo bytes. `image` is the picked photo as a
 * data URL or bare base64 — it rides in the request (compressed client-side
 * to stay well under the ~10 MiB callable cap) and is never written to
 * Storage. Response shape matches the plantnetIdentify callable.
 */
export async function identifyPlant(image: string): Promise<IdentifiedCandidate[]> {
  const callable = httpsCallable<{ image: string }, IdentifyPayload>(
    getFirebaseFunctions(),
    'plantnetIdentify',
  );
  const result = await callable({ image });
  return result.data.candidates;
}

export interface CreatePlantDraft {
  name: string;
  species: string | null;
  trefleId: number | null;
  mainImage: string | null;
  care: CareProfile | null;
}

/**
 * Writes the plant document under users/{uid}/plants/. The shared zod schema
 * validates the write client-side (the callable path does the same
 * server-side) and stamps schemaVersion, so every plant doc has one shape.
 */
export async function createPlant(draft: CreatePlantDraft): Promise<string> {
  const uid = requireUid();
  const data = plantSchema.parse(
    stampSchemaVersion({
      name: draft.name.trim(),
      species: draft.species,
      trefleId: draft.trefleId,
      mainImage: draft.mainImage,
      care: draft.care,
      lastWateredAt: null,
      lastFertilizedAt: null,
      createdAt: Timestamp.now(),
    }),
  );
  const ref = await addDoc(collection(getDb(), 'users', uid, 'plants'), data);
  return ref.id;
}
