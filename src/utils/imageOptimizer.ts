/**
 * Comprehensive Image Optimization and File Handling Utility
 * Supports all standard web and mobile image formats: JPG, PNG, WEBP, GIF, BMP, JFIF, AVIF, SVG, HEIC.
 */

export interface OptimizeImageOptions {
  maxDimension?: number;
  quality?: number;
  preserveAlpha?: boolean;
  targetFormat?: 'image/jpeg' | 'image/png' | 'image/webp' | 'auto';
}

/**
 * Checks whether a given File or Blob is an image based on MIME type or file extension.
 */
export function isImageFile(file: File | Blob): boolean {
  if (!file) return false;
  
  // Check MIME type first
  if (file.type && file.type.startsWith('image/')) {
    return true;
  }

  // Check file name extension fallback
  if ('name' in file && typeof file.name === 'string') {
    const name = file.name.toLowerCase();
    const imageExtensions = /\.(jpe?g|png|webp|gif|bmp|jfif|avif|heic|heif|svg|ico|tiff?)$/i;
    return imageExtensions.test(name);
  }

  return false;
}

/**
 * Reads a File as a base64 Data URL.
 */
export function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file into data URL.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an uploaded image file via HTML5 Canvas.
 * - Resizes large images down to maxDimension (maintaining aspect ratio)
 * - Compresses to lightweight JPEG/WEBP/PNG
 * - Gracefully falls back to raw data URL if canvas decoding is not supported (e.g. SVG or raw vectors)
 */
export async function optimizeImageFile(
  file: File | Blob,
  options: OptimizeImageOptions = {}
): Promise<string> {
  const {
    maxDimension = 1200,
    quality = 0.85,
    preserveAlpha = true,
    targetFormat = 'auto'
  } = options;

  // Validate format
  if (!isImageFile(file)) {
    throw new Error('Please select a valid image file (JPG, PNG, WEBP, GIF, etc.).');
  }

  // First, read raw data URL
  const rawDataUrl = await readFileAsDataUrl(file);

  // If file is SVG, return directly since vector graphics should not be rasterized via canvas
  if (file.type === 'image/svg+xml' || ('name' in file && typeof file.name === 'string' && file.name.toLowerCase().endsWith('.svg'))) {
    return rawDataUrl;
  }

  // Attempt canvas resize and compression
  return new Promise<string>((resolve) => {
    const img = new Image();
    
    // Set timeout in case image loading hangs
    const timeoutId = setTimeout(() => {
      // If canvas load times out, resolve with raw data URL safely
      resolve(rawDataUrl);
    }, 4000);

    img.onload = () => {
      clearTimeout(timeoutId);
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          resolve(rawDataUrl);
          return;
        }

        // Calculate aspect-ratio preserved dimensions
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Check if image format is PNG with possible transparency
        const isPng = file.type === 'image/png' || ('name' in file && typeof file.name === 'string' && file.name.toLowerCase().endsWith('.png'));

        if (!isPng || !preserveAlpha) {
          // Fill solid background for JPEG output to prevent black artifacts
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Determine output MIME format
        let outputMime = 'image/jpeg';
        if (targetFormat !== 'auto') {
          outputMime = targetFormat;
        } else if (isPng && preserveAlpha) {
          outputMime = 'image/png';
        } else {
          outputMime = 'image/jpeg';
        }

        try {
          const optimized = canvas.toDataURL(outputMime, quality);
          // Verify that export produced a valid data URL
          if (optimized && optimized.startsWith('data:image')) {
            resolve(optimized);
            return;
          }
        } catch {
          // Fallback to jpeg
          try {
            const fallbackJpeg = canvas.toDataURL('image/jpeg', quality);
            if (fallbackJpeg && fallbackJpeg.startsWith('data:image')) {
              resolve(fallbackJpeg);
              return;
            }
          } catch {}
        }

        resolve(rawDataUrl);
      } catch (canvasErr) {
        console.warn('Canvas optimization notice, using raw data URL fallback:', canvasErr);
        resolve(rawDataUrl);
      }
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      // If decoding in <img> fails, resolve with raw data URL rather than failing
      resolve(rawDataUrl);
    };

    img.src = rawDataUrl;
  });
}
