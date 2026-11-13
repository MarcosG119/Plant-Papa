// Pure care-tracking helpers shared by the garden list, plant cards and
// (later) the plant page. No Firestore, no React — just date math.

const WATERING_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A plant needs water when it was never watered or the last time is older than the grace window. */
export function needsWater(lastWateredAt: Date | null, now: Date = new Date()): boolean {
  if (!lastWateredAt) return true;
  return now.getTime() - lastWateredAt.getTime() > WATERING_GRACE_DAYS * DAY_MS;
}

/** Most recent care action of either kind, for "recently updated" ordering. */
function mostRecentCareAt(plant: {
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
}): number {
  const times = [plant.lastWateredAt?.getTime(), plant.lastFertilizedAt?.getTime()];
  return Math.max(...times.map((t) => t ?? 0));
}

/**
 * Garden ordering per the spec: plants needing water float to the top (most
 * neglected first — never-watered before stale), the rest by most recent care.
 */
export function sortGardenPlants<T extends { lastWateredAt: Date | null; lastFertilizedAt: Date | null }>(
  plants: T[],
  now: Date = new Date(),
): T[] {
  return [...plants].sort((a, b) => {
    const aThirsty = needsWater(a.lastWateredAt, now);
    const bThirsty = needsWater(b.lastWateredAt, now);
    if (aThirsty !== bThirsty) return aThirsty ? -1 : 1;
    if (aThirsty && bThirsty) {
      const aAge = a.lastWateredAt?.getTime() ?? 0;
      const bAge = b.lastWateredAt?.getTime() ?? 0;
      return aAge - bAge;
    }
    return mostRecentCareAt(b) - mostRecentCareAt(a);
  });
}

export interface CareStamps {
  lastWateredAt: Date | null;
  lastFertilizedAt: Date | null;
}

export type OptimisticOverrides = Record<string, Partial<CareStamps>>;

/**
 * Drops optimistic care overrides that the given server state has caught up
 * with — once the server-side value reaches the local one, the override has
 * no more information and must stop masking server changes from other sources.
 */
export function pruneOverrides(plants: GardenStampDocs, overrides: OptimisticOverrides): OptimisticOverrides {
  const pruned: OptimisticOverrides = {};
  for (const [plantId, override] of Object.entries(overrides)) {
    const server = plants[plantId];
    const remaining: Partial<CareStamps> = {};
    if (override.lastWateredAt instanceof Date) {
      if (!server?.lastWateredAt || server.lastWateredAt < override.lastWateredAt) {
        remaining.lastWateredAt = override.lastWateredAt;
      }
    }
    if (override.lastFertilizedAt instanceof Date) {
      if (!server?.lastFertilizedAt || server.lastFertilizedAt < override.lastFertilizedAt) {
        remaining.lastFertilizedAt = override.lastFertilizedAt;
      }
    }
    if (Object.keys(remaining).length > 0) pruned[plantId] = remaining;
  }
  return pruned;
}

export interface GardenStampDocs {
  [plantId: string]: CareStamps | undefined;
}

/** Applies optimistic overrides on top of snapshot data, without mutating either. */
export function mergeOverrides<T extends CareStamps & { id: string }>(
  plants: T[],
  overrides: OptimisticOverrides,
): T[] {
  return plants.map((plant) => {
    const override = overrides[plant.id];
    if (!override) return plant;
    return {
      ...plant,
      lastWateredAt: override.lastWateredAt ?? plant.lastWateredAt,
      lastFertilizedAt: override.lastFertilizedAt ?? plant.lastFertilizedAt,
    };
  });
}
