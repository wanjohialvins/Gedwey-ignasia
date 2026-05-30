/**
 * Converts a local file/content URI (e.g. from ImagePicker or audio recorder)
 * into a binary Blob using XMLHttpRequest. This bypasses the React Native
 * fetch API limitation which throws 'network request failed' for local file paths on Android.
 */
export function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.error('[uriToBlob] Failed to convert URI to Blob:', e);
      reject(new TypeError('Network request failed'));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}
