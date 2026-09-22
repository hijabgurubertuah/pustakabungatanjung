/**
 * Utility for compressing and processing book cover photos
 * Ensures images captured from high-res phone cameras fit seamlessly
 * into storage (typically < 100KB) without sacrificing visual quality.
 */
export async function compressImageFile(
  fileOrBlob: File | Blob,
  maxWidth = 720,
  maxHeight = 1080,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            maxHeight = height;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = () => {
        reject(new Error('Gagal memproses berkas gambar'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar'));
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Capture frame from live video element to compressed JPEG data URL
 */
export function captureVideoFrame(
  videoElement: HTMLVideoElement,
  maxWidth = 720,
  maxHeight = 1080,
  quality = 0.82
): string | null {
  if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return null;
  }

  let width = videoElement.videoWidth;
  let height = videoElement.videoHeight;

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
  } else {
    if (height > maxHeight) {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(videoElement, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Auto-crop image to exact 3x4 aspect ratio (Pasfoto Formal 3x4: 450px x 600px)
 * Keeps face centered with top-bias for head/shoulders formal framing.
 */
export async function cropToPasfoto3x4(
  fileOrDataUrl: File | Blob | string,
  targetWidth = 450,
  targetHeight = 600,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const srcW = img.width;
        const srcH = img.height;
        const targetRatio = targetWidth / targetHeight; // 3/4 = 0.75
        const srcRatio = srcW / srcH;

        let cropW = srcW;
        let cropH = srcH;
        let cropX = 0;
        let cropY = 0;

        if (srcRatio > targetRatio) {
          // Source is wider than 3:4 (e.g. landscape or square) -> crop sides
          cropW = Math.round(srcH * targetRatio);
          cropX = Math.round((srcW - cropW) / 2);
        } else if (srcRatio < targetRatio) {
          // Source is taller than 3:4 -> crop top/bottom with 20% top bias for head alignment
          cropH = Math.round(srcW / targetRatio);
          cropY = Math.round((srcH - cropH) * 0.2); // 20% from top
          if (cropY < 0) cropY = 0;
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Fill background white in case of transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw cropped region
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetWidth, targetHeight);

        const resultDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resultDataUrl);
      };

      img.onerror = () => reject(new Error('Gagal memuat gambar pasfoto'));
      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      processImage(fileOrDataUrl);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          processImage(e.target.result as string);
        } else {
          reject(new Error('Gagal membaca berkas'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca berkas foto'));
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

