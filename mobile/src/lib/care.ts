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
