/**
 * Validates an image file meets podcast cover art requirements.
 * Apple Podcasts / RSS.com: 1400×1400 to 3000×3000 pixels, square, JPG or PNG.
 */
export interface ImageValidationResult {
  valid: boolean;
  width: number;
  height: number;
  error?: string;
}

const MIN_DIMENSION = 1400;
const MAX_DIMENSION = 3000;

export function validatePodcastCoverImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      resolve({ valid: false, width: 0, height: 0, error: "Cover art must be JPG or PNG (required by Apple Podcasts)." });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w !== h) {
        resolve({
          valid: false,
          width: w,
          height: h,
          error: `Artwork must be square. Yours is ${w}×${h}px.`,
        });
        return;
      }
      if (w < MIN_DIMENSION || w > MAX_DIMENSION) {
        resolve({
          valid: false,
          width: w,
          height: h,
          error: `Artwork must be between ${MIN_DIMENSION}×${MIN_DIMENSION} and ${MAX_DIMENSION}×${MAX_DIMENSION} pixels (Apple Podcasts). Yours is ${w}×${h}px.`,
        });
        return;
      }

      resolve({ valid: true, width: w, height: h });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, width: 0, height: 0, error: "Could not read image. Please try a different file." });
    };

    img.src = url;
  });
}
