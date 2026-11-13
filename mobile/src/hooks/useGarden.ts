import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { sortGardenPlants } from '@/lib/care';
import {
  resolveImageUri,
  subscribeToGarden,
  type GardenPlant,
} from '@/services/garden';

export interface UseGardenResult {
  plants: GardenPlant[];
  /** True until auth resolves and the first snapshot (or its error) lands. */
  loading: boolean;
  error: string | null;
  imageUris: Record<string, string>;
  retry: () => void;
}

/** Garden state over a live Firestore snapshot of the signed-in user's plants. */
export function useGarden(uid: string | null | undefined): UseGardenResult {
  const [snapshotPlants, setSnapshotPlants] = useState<GardenPlant[]>([]);
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const attemptedImages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!uid) {
      setReady(true);
      return;
    }
    setReady(false);
    setSnapshotError(null);

    const unsubscribe = subscribeToGarden(
      uid,
      (plants) => {
        setSnapshotPlants(plants);
        setReady(true);
      },
      (error) => {
        setSnapshotError(error.message);
        setReady(true);
      },
    );
    return unsubscribe;
  }, [uid, attempt]);

  // Resolve cover photos to fetchable https URLs once per plant.
  useEffect(() => {
    let cancelled = false;
    for (const plant of snapshotPlants) {
      if (!plant.mainImage || attemptedImages.current.has(plant.id)) continue;
      attemptedImages.current.add(plant.id);
      resolveImageUri(plant.mainImage)
        .then((uri) => {
          if (!cancelled) setImageUris((prev) => ({ ...prev, [plant.id]: uri }));
        })
        .catch((error) => {
          // A dead cover photo must not break the card — it renders without one.
          console.warn(`Failed to resolve cover image for plant ${plant.id}:`, error);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [snapshotPlants]);

  const plants = useMemo(() => sortGardenPlants(snapshotPlants), [snapshotPlants]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { plants, loading: !ready, error: snapshotError, imageUris, retry };
}
