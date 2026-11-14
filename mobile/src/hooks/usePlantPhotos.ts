import { useCallback, useEffect, useRef, useState } from 'react';

import { resolveImageUri } from '@/services/garden';
import {
  setPlantCover,
  subscribeToPhotos,
  uploadPlantPhoto,
  type PlantPhoto,
} from '@/services/photos';

export interface GalleryPhotoView extends PlantPhoto {
  /** Fetchable https URL resolved from the stored gs:// path. */
  uri: string;
}

export interface UsePlantPhotosResult {
  photos: GalleryPhotoView[];
  /** True until the first snapshot (or its error) lands. */
  loading: boolean;
  error: string | null;
  uploading: boolean;
  /** 0..1, meaningful only while uploading. */
  progress: number;
  uploadError: string | null;
  coverError: string | null;
  upload: (localUri: string) => Promise<void>;
  setCover: (photo: GalleryPhotoView) => Promise<void>;
  retry: () => void;
}

/**
 * Gallery state: a live photo subscription plus client-direct uploads with
 * visible progress. A failed upload rolls back by simply not being committed
 * — the snapshot stays the source of truth — and surfaces as uploadError.
 */
export function usePlantPhotos(
  uid: string | null | undefined,
  plantId: string,
): UsePlantPhotosResult {
  const [snapshotPhotos, setSnapshotPhotos] = useState<PlantPhoto[]>([]);
  const [uris, setUris] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const attemptedUrls = useRef<Set<string>>(new Set());
  const mounted = useRef(true);

  useEffect(() => () => { mounted.current = false; }, []);

  useEffect(() => {
    if (!uid || !plantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    return subscribeToPhotos(
      uid,
      plantId,
      (next) => {
        setSnapshotPhotos(next);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
  }, [uid, plantId, attempt]);

  // Resolve gs:// photo paths to fetchable https URLs once per URL. Results
  // are URL-keyed and stay valid across snapshots, so nothing cancels them
  // but unmount: an effect re-run (new snapshot) used to reset the old
  // cancelled flag and silently discard every in-flight resolution, leaving
  // the gallery empty forever.
  useEffect(() => {
    for (const photo of snapshotPhotos) {
      if (attemptedUrls.current.has(photo.url)) continue;
      attemptedUrls.current.add(photo.url);
      resolveImageUri(photo.url)
        .then((uri) => {
          if (mounted.current) setUris((prev) => ({ ...prev, [photo.url]: uri }));
        })
        .catch((err) => {
          // A dead photo object must not break the gallery — it is skipped.
          console.warn(`Failed to resolve photo for plant ${plantId}:`, err);
        });
    }
  }, [snapshotPhotos, plantId]);

  const photos = snapshotPhotos.flatMap((photo) => {
    const uri = uris[photo.url];
    return uri ? [{ ...photo, uri }] : [];
  });

  const upload = useCallback(
    async (localUri: string) => {
      if (!uid) return;
      setUploading(true);
      setProgress(0);
      setUploadError(null);
      try {
        await uploadPlantPhoto(uid, plantId, localUri, setProgress);
      } catch {
        setUploadError('Could not upload the photo. Check your connection and try again.');
      } finally {
        setUploading(false);
        setProgress(0);
      }
    },
    [uid, plantId],
  );

  const setCover = useCallback(
    async (photo: GalleryPhotoView) => {
      if (!uid) return;
      setCoverError(null);
      try {
        await setPlantCover(uid, plantId, photo.url);
      } catch {
        setCoverError('Could not set the cover photo. Check your connection and try again.');
      }
    },
    [uid, plantId],
  );

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  return {
    photos,
    loading,
    error,
    uploading,
    progress,
    uploadError,
    coverError,
    upload,
    setCover,
    retry,
  };
}
