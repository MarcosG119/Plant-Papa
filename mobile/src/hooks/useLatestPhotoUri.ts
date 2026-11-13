import { useEffect, useState } from 'react';

import { subscribeToLatestPhoto } from '@/services/garden';

/**
 * The card image source, per the owner's priority: the plant's most recent
 * growth photo, else null (the caller falls back to the species image saved
 * at add time, then the neutral placeholder). One limit(1) listener per card.
 */
export function useLatestPhotoUri(
  uid: string | null | undefined,
  plantId: string,
): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setUri(null);
      return;
    }
    return subscribeToLatestPhoto(uid, plantId, setUri);
  }, [uid, plantId]);

  return uri;
}
