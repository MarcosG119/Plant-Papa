// Prepares a picked photo for the plantnetIdentify callable. The image rides
// in the request as base64 (the callable caps at ~10 MiB), so photos are
// downsampled and recompressed before sending — no Storage write happens
// until the plant is saved.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Longest edge cap: plenty for PlantNet, small enough that a 0.7-quality
// JPEG of it lands far under the callable limit after base64 inflation.
const MAX_EDGE_PX = 1600;
const COMPRESS_QUALITY = 0.7;

export interface PreparedIdentifyImage {
  /** Base64 JPEG bytes (no data: prefix) for the plantnetIdentify payload. */
  base64: string;
  /** Local cache uri of the compressed image — uploaded only on save. */
  uri: string;
}

export async function prepareIdentifyImage(localUri: string): Promise<PreparedIdentifyImage> {
  // maxWidth/maxHeight downsample during decode; saving with no further
  // actions re-encodes at the requested quality and format.
  const rendered = await ImageManipulator.manipulate(localUri, {
    maxWidth: MAX_EDGE_PX,
    maxHeight: MAX_EDGE_PX,
  }).renderAsync();
  const saved = await rendered.saveAsync({
    compress: COMPRESS_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });
  if (!saved.base64) {
    throw new Error('identify/compress-failed');
  }
  return { base64: saved.base64, uri: saved.uri };
}
