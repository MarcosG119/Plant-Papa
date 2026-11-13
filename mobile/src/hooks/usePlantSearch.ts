import { useEffect, useState } from 'react';

import { searchPlants, type PlantSummary } from '@/services/plants';

import { useDebouncedValue } from './useDebouncedValue';

const SEARCH_DEBOUNCE_MS = 350;

export type PlantSearchStatus = 'idle' | 'loading' | 'error' | 'empty' | 'results';

export interface PlantSearchState {
  status: PlantSearchStatus;
  results: PlantSummary[];
  error: string | null;
  retry: () => void;
}

/**
 * Debounced Trefle search over the searchPlants callable. The debounce keeps
 * typing cheap; the cancellation flag drops stale responses so a fast second
 * query can never overwrite a slower earlier one.
 */
export function usePlantSearch(query: string): PlantSearchState {
  const debouncedQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
  const [state, setState] = useState<Omit<PlantSearchState, 'retry'>>({
    status: 'idle',
    results: [],
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (debouncedQuery.length === 0) {
      setState({ status: 'idle', results: [], error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    searchPlants(debouncedQuery)
      .then((payload) => {
        if (cancelled) return;
        setState({
          status: payload.results.length === 0 ? 'empty' : 'results',
          results: payload.results,
          error: null,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', results: [], error: describeSearchError(err) });
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, attempt]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

// Maps service errors to one human line; the screen renders it as-is.
export function describeSearchError(err: unknown): string {
  const message = err instanceof Error ? err.message : '';
  if (message.startsWith('auth/')) {
    return 'You are signed out. Sign in again to search plants.';
  }
  if (message.includes('permission-denied') || message.includes('unauthenticated')) {
    return 'You are signed out. Sign in again to search plants.';
  }
  return 'Could not reach the plant search. Check your connection and try again.';
}
