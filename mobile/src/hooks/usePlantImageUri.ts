import { useEffect, useState } from 'react';

import { resolveImageUri } from '@/services/garden';
import { useLatestPhotoUri } from './useLatestPhotoUri';

/**
 * The plant page header image, reusing the garden card's resolution priority
 * from PR #7: the plant's most recent growth photo (live), else the image
 * saved at add time (gs:// resolved through Storage), else null so the caller
 * renders the neutral placeholder. Never fetches Trefle.
 */
export function usePlantImageUri(
  uid: string | null | undefined,
  plantId: string,
  mainImage: string | null,
): string | null {
  const latestPhotoUri = useLatestPhotoUri(uid, plantId);
  const [savedImageUri, setSavedImageUri] = useState<string | null>(null);

  useEffect(() => {
    setSavedImageUri(null);
    if (!mainImage) return;
    let cancelled = false;
    resolveImageUri(mainImage)
      .then((uri) => {
        if (!cancelled) setSavedImageUri(uri);
      })
      .catch((error) => {
        // A dead cover photo must not break the page — it renders without one.
        console.warn(`Failed to resolve cover image for plant ${plantId}:`, error);
      });
    return () => {
      cancelled = true;
    };
  }, [mainImage, plantId]);

  return latestPhotoUri ?? savedImageUri;
}
