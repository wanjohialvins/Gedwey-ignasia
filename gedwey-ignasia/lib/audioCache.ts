import { File, Paths, Directory } from 'expo-file-system';

const CACHE_DIR_NAME = 'audio_cache';

/** Lazily ensure our audio cache sub-directory exists and return it. */
function getAudioCacheDir(): Directory {
  const dir = new Directory(Paths.cache, CACHE_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

/**
 * Checks if a remote audio URL is already downloaded to local cache.
 * If yes, returns the local 'file://' URI. If no, downloads it and
 * returns the new local URI so the track is available offline thereafter.
 */
export async function getCachedAudioUri(remoteUrl: string): Promise<string> {
  if (!remoteUrl || typeof remoteUrl !== 'string') return remoteUrl;

  // Return immediately if it's already a local file path or doesn't look like an HTTP link
  if (
    remoteUrl.startsWith('file://') ||
    remoteUrl.startsWith('/') ||
    remoteUrl.startsWith('assets/') ||
    !remoteUrl.startsWith('http')
  ) {
    return remoteUrl;
  }

  // Generate a reliable, unique local filename based on the remote URL
  const cleanUrl = remoteUrl.split('?')[0];
  const filename = cleanUrl.split('/').pop() || 'temp_track.mp3';

  try {
    const cacheDir = getAudioCacheDir();
    const cachedFile = new File(cacheDir, filename);

    if (cachedFile.exists) {
      console.log('[AudioCache] Serving cached track:', cachedFile.uri);
      return cachedFile.uri;
    }

    console.log('[AudioCache] Downloading audio to local cache:', remoteUrl);
    const downloaded = await File.downloadFileAsync(remoteUrl, cachedFile, { idempotent: true });
    console.log('[AudioCache] Download complete. Cached at:', downloaded.uri);
    return downloaded.uri;
  } catch (error) {
    console.warn('[AudioCache] Caching failed, falling back to streaming:', error);
    return remoteUrl;
  }
}

/**
 * Pre-downloads multiple remote tracks in the background to ensure they are available offline.
 */
export async function preCacheTracks(urls: string[]): Promise<void> {
  const tasks = urls.map((url) => getCachedAudioUri(url).catch(() => {}));
  await Promise.all(tasks);
}
