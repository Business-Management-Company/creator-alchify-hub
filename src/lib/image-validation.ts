/**
 * Validates an image file meets podcast cover art requirements.
 * Apple Podcasts requires: exactly 3000×3000 pixels, JPG/PNG, RGB color space.
 */
export interface ImageValidationResult {
  valid: boolean;
  width: number;
  height: number;
  error?: string;
}

const REQUIRED_DIMENSION = 3000;

export function validatePodcastCoverImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    // Check file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      resolve({ valid: false, width: 0, height: 0, error: "Cover art must be JPG or PNG format." });
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w !== REQUIRED_DIMENSION || h !== REQUIRED_DIMENSION) {
        resolve({
          valid: false,
          width: w,
          height: h,
          error: `Artwork must be exactly ${REQUIRED_DIMENSION}×${REQUIRED_DIMENSION} pixels. Yours is ${w}×${h}px.`,
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
