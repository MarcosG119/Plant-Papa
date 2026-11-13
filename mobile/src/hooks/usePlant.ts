import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  mergeOverrides,
  pruneOverrides,
  type CareStamps,
  type OptimisticOverrides,
} from '@/lib/care';
import {
  refreshPlantCare,
  subscribeToPlant,
  type PlantPagePlant,
} from '@/services/plantPage';
import { callLogCare, type CareType } from '@/services/garden';

export interface UsePlantResult {
  plant: PlantPagePlant | null;
  /** True until the first snapshot (or its error) lands. */
  loading: boolean;
  /** Null when the snapshot reports the plant no longer exists. */
  missing: boolean;
  error: string | null;
  careError: string | null;
  refreshingCare: boolean;
  careRefreshError: string | null;
  logCare: (type: CareType) => Promise<void>;
  /** Explicit user-tapped re-fetch of the care block from Trefle. */
  refreshCare: () => Promise<void>;
  retry: () => void;
}

/**
 * Plant page state over a live Firestore snapshot, with the same optimistic
 * care stamps as the garden list: a tap shows "just now" immediately, the
 * logCare callable's transaction is the source of truth, and the snapshot
 * reconciles. refreshCare is the spec's single sanctioned Trefle call and is
 * only ever invoked by an explicit user tap.
 */
export function usePlant(
  uid: string | null | undefined,
  plantId: string,
): UsePlantResult {
  const [snapshotPlant, setSnapshotPlant] = useState<PlantPagePlant | null>(null);
  const [overrides, setOverrides] = useState<OptimisticOverrides>({});
  const [missing, setMissing] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [careError, setCareError] = useState<string | null>(null);
  const [refreshingCare, setRefreshingCare] = useState(false);
  const [careRefreshError, setCareRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setReady(true);
      return;
    }
    setReady(false);
    setMissing(false);
    setSnapshotError(null);

    return subscribeToPlant(
      uid,
      plantId,
      (plant) => {
        setMissing(plant === null);
        setSnapshotPlant(plant);
        if (plant) {
          // Server stamps caught up with an override -> the override is spent.
          const serverStamps: Record<string, CareStamps | undefined> = {
            [plant.id]: {
              lastWateredAt: plant.lastWateredAt,
              lastFertilizedAt: plant.lastFertilizedAt,
            },
          };
          setOverrides((prev) => pruneOverrides(serverStamps, prev));
        }
        setReady(true);
      },
      (error) => {
        setSnapshotError(error.message);
        setReady(true);
      },
    );
  }, [uid, plantId, attempt]);

  const plant = useMemo(() => {
    if (!snapshotPlant) return snapshotPlant;
    const merged = mergeOverrides([snapshotPlant], overrides)[0];
    return merged ?? snapshotPlant;
  }, [snapshotPlant, overrides]);

  const logCare = useCallback(
    async (type: CareType) => {
      if (!plant) return;
      const stamp = type === 'water' ? 'lastWateredAt' : 'lastFertilizedAt';
      setCareError(null);
      setOverrides((prev) => ({
        ...prev,
        [plant.id]: { ...prev[plant.id], [stamp]: new Date() },
      }));
      try {
        const result = await callLogCare(plant.id, type);
        setOverrides((prev) => pruneOverrides({ [plant.id]: result as CareStamps }, prev));
      } catch {
        // Roll back this tap's optimistic stamp; surface the failure — never silent.
        setOverrides((prev) => {
          const entry = prev[plant.id];
          if (!entry) return prev;
          const remaining = { ...entry };
          delete remaining[stamp];
          if (Object.keys(remaining).length === 0) {
            const { [plant.id]: _dropped, ...rest } = prev;
            return rest;
          }
          return { ...prev, [plant.id]: remaining };
        });
        setCareError(
          type === 'water'
            ? 'Could not record the watering. Check your connection and try again.'
            : 'Could not record the feeding. Check your connection and try again.',
        );
      }
    },
    [plant],
  );

  const refreshCare = useCallback(async () => {
    const trefleId = plant?.trefleId;
    if (!trefleId || refreshingCare) return;
    setRefreshingCare(true);
    setCareRefreshError(null);
    try {
      await refreshPlantCare(plantId, trefleId);
    } catch {
      setCareRefreshError(
        'Could not refresh the care instructions. Check your connection and try again.',
      );
    } finally {
      setRefreshingCare(false);
    }
  }, [plant?.trefleId, plantId, refreshingCare]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    plant,
    loading: !ready,
    missing,
    error: snapshotError,
    careError,
    refreshingCare,
    careRefreshError,
    logCare,
    refreshCare,
    retry,
  };
}
