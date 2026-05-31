/** Reads a local file URI into bytes for Supabase storage uploads. */
export async function uriToUint8Array(uri: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      const status = xhr.status;
      if (status === 0 || (status >= 200 && status < 300)) {
        const blob = xhr.response;
        const reader = new FileReader();
        reader.onloadend = function () {
          const base64data = reader.result as string;
          // Format is typically: "data:application/octet-stream;base64,..."
          const commaIndex = base64data.indexOf(',');
          const base64 = commaIndex !== -1 ? base64data.slice(commaIndex + 1) : base64data;
          
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          resolve(bytes);
        };
        reader.onerror = function (e) {
          reject(new Error('FileReader failed: ' + JSON.stringify(e)));
        };
        reader.readAsDataURL(blob);
      } else {
        reject(new Error(`Failed to load file, status: ${xhr.status}`));
      }
    };
    xhr.onerror = function (e) {
      reject(new Error('XMLHttpRequest failed: ' + JSON.stringify(e)));
    };
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export async function uriToArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const bytes = await uriToUint8Array(uri);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/** @deprecated Prefer uriToUint8Array for Supabase uploads */
export async function uriToBlob(uri: string): Promise<Blob> {
  const bytes = await uriToUint8Array(uri);
  return new Blob([bytes as unknown as BlobPart]);
}

