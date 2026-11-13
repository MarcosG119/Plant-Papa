import { useEffect, useState } from 'react';

import { subscribeToCareLog, type CareLogEntry } from '@/services/plantPage';

export interface UseCareLogResult {
  entries: CareLogEntry[];
  /** True until the first snapshot (or its error) lands. */
  loading: boolean;
  error: string | null;
  retry: () => void;
}

/** Recent care history for the plant page's Care tab. */
export function useCareLog(
  uid: string | null | undefined,
  plantId: string,
): UseCareLogResult {
  const [entries, setEntries] = useState<CareLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!uid || !plantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeToCareLog(
      uid,
      plantId,
      (next) => {
        setEntries(next);
        setLoading(false);
      },
      (err) => {
        // The timeline is supplementary: a failed subscription shows the
        // cached care card still, with the failure surfaced as an error line.
        setError(err.message);
        setLoading(false);
      },
    );
  }, [uid, plantId, attempt]);

  return { entries, loading, error, retry: () => setAttempt((a) => a + 1) };
}
