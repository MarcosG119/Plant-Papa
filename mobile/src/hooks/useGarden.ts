import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  mergeOverrides,
  pruneOverrides,
  sortGardenPlants,
  type CareStamps,
  type OptimisticOverrides,
} from '@/lib/care';
import {
  callLogCare,
  resolveImageUri,
  subscribeToGarden,
  type CareType,
  type GardenPlant,
} from '@/services/garden';

export interface UseGardenResult {
  plants: GardenPlant[];
  /** True until auth resolves and the first snapshot (or its error) lands. */
  loading: boolean;
  error: string | null;
  imageUris: Record<string, string>;
  careError: string | null;
  logCare: (plantId: string, type: CareType) => Promise<void>;
  retry: () => void;
}

/**
 * Garden state over a live Firestore snapshot, with optimistic care stamps:
 * a tap shows "just now" immediately, the logCare callable's transaction is
 * the source of truth, and the snapshot reconciles. Failed calls roll back
 * and surface as careError — never a silent failure.
 */
export function useGarden(uid: string | null | undefined): UseGardenResult {
  const [snapshotPlants, setSnapshotPlants] = useState<GardenPlant[]>([]);
  const [overrides, setOverrides] = useState<OptimisticOverrides>({});
  const [imageUris, setImageUris] = useState<Record<string, string>>({});
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [careError, setCareError] = useState<string | null>(null);
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
        // Server stamps caught up with an override -> the override is spent.
        const serverStamps: Record<string, CareStamps | undefined> = Object.fromEntries(
          plants.map((plant) => [
            plant.id,
            { lastWateredAt: plant.lastWateredAt, lastFertilizedAt: plant.lastFertilizedAt },
          ]),
        );
        setOverrides((prev) => pruneOverrides(serverStamps, prev));
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

  const plants = useMemo(
    () => sortGardenPlants(mergeOverrides(snapshotPlants, overrides)),
    [snapshotPlants, overrides],
  );

  const logCare = useCallback(async (plantId: string, type: CareType) => {
    const stamp = type === 'water' ? 'lastWateredAt' : 'lastFertilizedAt';
    setCareError(null);
    setOverrides((prev) => ({
      ...prev,
      [plantId]: { ...prev[plantId], [stamp]: new Date() },
    }));
    try {
      const result = await callLogCare(plantId, type);
      // The write committed; drop only overrides older than the server's state
      // (a concurrent tap on the other stamp may still be in flight).
      setOverrides((prev) => pruneOverrides({ [plantId]: result as CareStamps }, prev));
    } catch (error) {
      // Roll back this tap's optimistic stamp; the other stamp's tap is kept.
      setOverrides((prev) => {
        const entry = prev[plantId];
        if (!entry) return prev;
        const remaining = { ...entry };
        delete remaining[stamp];
        if (Object.keys(remaining).length === 0) {
          const { [plantId]: _dropped, ...rest } = prev;
          return rest;
        }
        return { ...prev, [plantId]: remaining };
      });
      setCareError(
        type === 'water'
          ? 'Could not record the watering. Check your connection and try again.'
          : 'Could not record the feeding. Check your connection and try again.',
      );
    }
  }, []);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return { plants, loading: !ready, error: snapshotError, imageUris, careError, logCare, retry };
}
