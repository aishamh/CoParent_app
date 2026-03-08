import AsyncStorage from "@react-native-async-storage/async-storage";
import ReactNativeBlobUtil from "react-native-blob-util";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MANIFEST_KEY = "@coparent/image-cache-manifest";
const CACHE_DIR_NAME = "image-cache";
const MAX_CONCURRENT_DOWNLOADS = 4;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CacheEntry {
  localPath: string;
  cachedAt: number;
}

type CacheManifest = Record<string, CacheEntry>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCacheDirectory(): string {
  return `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${CACHE_DIR_NAME}`;
}

/** Deterministic filename from a URL using a simple hash. */
function hashUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

function extractExtension(url: string): string {
  const pathname = url.split("?")[0];
  const lastDot = pathname.lastIndexOf(".");
  if (lastDot === -1) return "jpg";
  const ext = pathname.slice(lastDot + 1).toLowerCase();
  const validExtensions = ["jpg", "jpeg", "png", "webp", "gif", "svg"];
  return validExtensions.includes(ext) ? ext : "jpg";
}

function buildLocalPath(url: string): string {
  const filename = `${hashUrl(url)}.${extractExtension(url)}`;
  return `${getCacheDirectory()}/${filename}`;
}

// ---------------------------------------------------------------------------
// Manifest persistence
// ---------------------------------------------------------------------------

let manifestCache: CacheManifest | null = null;

async function loadManifest(): Promise<CacheManifest> {
  if (manifestCache) return manifestCache;

  try {
    const raw = await AsyncStorage.getItem(MANIFEST_KEY);
    manifestCache = raw ? (JSON.parse(raw) as CacheManifest) : {};
  } catch {
    manifestCache = {};
  }
  return manifestCache;
}

async function saveManifest(): Promise<void> {
  if (!manifestCache) return;
  try {
    await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifestCache));
  } catch {
    // Silently handle storage write failure
  }
}

// ---------------------------------------------------------------------------
// Directory setup
// ---------------------------------------------------------------------------

let directoryReady = false;

async function ensureCacheDirectory(): Promise<void> {
  if (directoryReady) return;

  const dir = getCacheDirectory();
  const exists = await ReactNativeBlobUtil.fs.isDir(dir);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(dir);
  }
  directoryReady = true;
}

// ---------------------------------------------------------------------------
// In-flight download deduplication
// ---------------------------------------------------------------------------

const inFlightDownloads = new Map<string, Promise<string>>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a local file:// URI for the given remote URL.
 * Downloads the image on first request; returns the cached path on subsequent calls.
 */
async function getOrCache(url: string): Promise<string> {
  const manifest = await loadManifest();

  // Already cached — verify the file still exists on disk
  const existing = manifest[url];
  if (existing) {
    const fileExists = await ReactNativeBlobUtil.fs.exists(existing.localPath);
    if (fileExists) {
      return `file://${existing.localPath}`;
    }
    // File was deleted externally — remove stale manifest entry
    delete manifest[url];
  }

  // Deduplicate concurrent requests for the same URL
  const inflight = inFlightDownloads.get(url);
  if (inflight) return inflight;

  const downloadPromise = downloadAndCache(url);
  inFlightDownloads.set(url, downloadPromise);

  try {
    return await downloadPromise;
  } finally {
    inFlightDownloads.delete(url);
  }
}

async function downloadAndCache(url: string): Promise<string> {
  await ensureCacheDirectory();

  const localPath = buildLocalPath(url);

  try {
    const response = await ReactNativeBlobUtil.config({
      path: localPath,
    }).fetch("GET", url);

    const status = response.info().status;
    if (status < 200 || status >= 300) {
      // Clean up failed download
      await ReactNativeBlobUtil.fs.unlink(localPath).catch(() => {});
      throw new Error(`Download failed with status ${status}`);
    }

    // Update manifest
    const manifest = await loadManifest();
    manifest[url] = { localPath, cachedAt: Date.now() };
    await saveManifest();

    return `file://${localPath}`;
  } catch (error) {
    // Clean up partial file on failure
    await ReactNativeBlobUtil.fs.unlink(localPath).catch(() => {});
    throw error;
  }
}

/**
 * Pre-download a batch of image URLs concurrently.
 * Silently skips already-cached URLs and failed downloads.
 */
async function prefetchBatch(urls: string[]): Promise<void> {
  const manifest = await loadManifest();

  // Filter to only uncached URLs
  const uncachedUrls = urls.filter((url) => !manifest[url]);
  if (uncachedUrls.length === 0) return;

  // Process in chunks to limit concurrency
  for (let i = 0; i < uncachedUrls.length; i += MAX_CONCURRENT_DOWNLOADS) {
    const chunk = uncachedUrls.slice(i, i + MAX_CONCURRENT_DOWNLOADS);
    await Promise.allSettled(chunk.map((url) => getOrCache(url)));
  }
}

/**
 * Check if a URL is already cached locally.
 */
async function isCached(url: string): Promise<boolean> {
  const manifest = await loadManifest();
  const entry = manifest[url];
  if (!entry) return false;

  return ReactNativeBlobUtil.fs.exists(entry.localPath);
}

/**
 * Returns total size of all cached images in bytes.
 */
async function getCacheSize(): Promise<number> {
  const manifest = await loadManifest();
  let totalBytes = 0;

  for (const entry of Object.values(manifest)) {
    try {
      const stat = await ReactNativeBlobUtil.fs.stat(entry.localPath);
      totalBytes += Number(stat.size);
    } catch {
      // File may have been deleted externally
    }
  }
  return totalBytes;
}

/**
 * Returns the number of cached images.
 */
async function getCachedCount(): Promise<number> {
  const manifest = await loadManifest();
  return Object.keys(manifest).length;
}

/**
 * Remove all cached images and reset the manifest.
 */
async function clearCache(): Promise<void> {
  const dir = getCacheDirectory();
  try {
    const exists = await ReactNativeBlobUtil.fs.isDir(dir);
    if (exists) {
      await ReactNativeBlobUtil.fs.unlink(dir);
    }
  } catch {
    // Best-effort cleanup
  }

  manifestCache = {};
  directoryReady = false;
  await AsyncStorage.removeItem(MANIFEST_KEY).catch(() => {});
}

// ---------------------------------------------------------------------------
// Export as singleton
// ---------------------------------------------------------------------------

export const imageCache = {
  getOrCache,
  prefetchBatch,
  isCached,
  getCacheSize,
  getCachedCount,
  clearCache,
};
