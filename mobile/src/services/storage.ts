// Client-side Storage helpers shared by the add-plant save and the plant
// gallery. Uploads go through the SDK (the SDK handles auth tokens); rules
// verify ownership from the path and the { uid } custom metadata written
// here. Identify itself writes nothing to Storage — the photo rides in the
// plantnetIdentify payload (see lib/identifyImage) and uploads happen only
// once the plant is saved.

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
