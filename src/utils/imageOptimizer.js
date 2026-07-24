import * as ImageManipulator from 'expo-image-manipulator';
import { File, Directory, Paths } from 'expo-file-system';

// Subfolder inside the (persistent) document directory for optimized images
// that are pending upload.
const UPLOAD_DIR_NAME = 'upload-cache';

// Copy a (possibly cache-based) image into the persistent document directory.
// expo-image-manipulator writes to the cache dir, which Android can evict
// before the user submits, causing FileNotFoundException at upload time.
export const persistImage = (tempUri) => {
  const dir = new Directory(Paths.document, UPLOAD_DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  const dest = new File(dir, `img_${Date.now()}_${Math.round(Math.random() * 1e6)}.jpg`);
  if (dest.exists) dest.delete();
  new File(tempUri).copy(dest);
  return dest.uri;
};

// Longest-side cap. 2048px keeps photos crisp full-width even on a 12" tablet
// (e.g. iPad Pro 12.9" ~2048px logical width) while keeping file sizes reasonable.
export const MAX_IMAGE_DIMENSION = 2048;

// JPEG quality. 0.85 is visually near-lossless for photos but much smaller than 1.0.
export const IMAGE_COMPRESS = 0.85;

// Build a resize action that only downscales (never upscales) the longest side.
export const buildResizeAction = (width, height, maxDimension = MAX_IMAGE_DIMENSION) => {
  const w = width || 0;
  const h = height || 0;
  const longest = Math.max(w, h);
  if (!longest || longest <= maxDimension) return null;
  return w >= h ? { resize: { width: maxDimension } } : { resize: { height: maxDimension } };
};

// Optimize a single image: optionally downscale, then compress to JPEG.
// Returns the optimized URI, or the original URI if manipulation fails.
export const optimizeImage = async (uri, options = {}) => {
  const {
    width,
    height,
    maxDimension = MAX_IMAGE_DIMENSION,
    compress = IMAGE_COMPRESS,
  } = options;

  const actions = [];
  const resize = buildResizeAction(width, height, maxDimension);
  if (resize) actions.push(resize);

  try {
    const result = await ImageManipulator.manipulateAsync(uri, actions, {
      compress,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    // Move the optimized image out of the evictable cache dir so it still
    // exists when the user submits the form and we read its bytes for upload.
    try {
      return persistImage(result.uri);
    } catch (persistErr) {
      console.warn('Persisting optimized image failed, using temp uri:', persistErr);
      return result.uri;
    }
  } catch (e) {
    console.error('Image optimization failed:', e);
    return uri;
  }
};
