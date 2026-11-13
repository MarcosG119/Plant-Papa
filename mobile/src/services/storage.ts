// Client-direct Storage uploads for the add-plant photo path. The identify
// call downloads the object server-side, so the photo is uploaded before
// plantnetIdentify runs. Rules verify ownership from the path and the
// { uid } custom metadata written here.
import { ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage } from '@/config/firebase';

import { requireUid } from './plants';

/**
 * React Native's XHR-based Blob is the pattern the Expo Firebase Storage
 * guide documents; plain fetch(uri).blob() is not reliable on Android.
 * Exported for the plant gallery's uploads (same XHR quirk).
 */
export function toBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('storage/blob-read-failed'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export interface UploadedIdentifyPhoto {
  /** gs:// object path handed to the identifyPlant callable. */
  gsUrl: string;
  uid: string;
}

/** Uploads a camera/gallery image to the caller's own Storage tree. */
export async function uploadIdentifyPhoto(localUri: string): Promise<UploadedIdentifyPhoto> {
  const uid = requireUid();
  const objectPath = `users/${uid}/identify/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const storageRef = ref(getFirebaseStorage(), objectPath);
  const blob = await toBlob(localUri);
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
    customMetadata: { uid },
  });
  return { gsUrl: `gs://${storageRef.bucket}/${objectPath}`, uid };
}
