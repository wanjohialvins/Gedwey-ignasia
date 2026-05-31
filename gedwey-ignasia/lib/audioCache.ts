import * as FileSystem from 'expo-file-system/legacy';

/**
 * Checks if a remote audio URL is already downloaded to local document storage.
 * If yes, returns the local 'file://' path. If no, downloads it in the background
 * and returns the new local path so the track is available offline thereafter.
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
  const localUri = `${FileSystem.documentDirectory}${filename}`;

  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      console.log('[AudioCache] Serving cached track:', localUri);
      return localUri;
    }

    console.log('[AudioCache] Downloading audio to local cache:', remoteUrl);
    const result = await FileSystem.downloadAsync(remoteUrl, localUri);
    console.log('[AudioCache] Download complete. Cached at:', result.uri);
    return result.uri;
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
