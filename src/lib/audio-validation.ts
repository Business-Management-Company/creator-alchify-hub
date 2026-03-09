/**
 * Allowed audio file types for podcast episode uploads.
 * Align with common podcast formats and RSS/Apple recommendations.
 */
export const ALLOWED_AUDIO_EXTENSIONS = [
  "mp3",
  "m4a",
  "aac",
  "wav",
  "webm",
  "ogg",
  "oga",
  "flac",
] as const;

export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/wave",
  "audio/webm",
  "audio/ogg",
  "audio/flac",
]);

/** Max file size for episode audio: 200 MB */
export const MAX_AUDIO_FILE_SIZE_BYTES = 200 * 1024 * 1024;

export function getAudioFileExtension(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext && ALLOWED_AUDIO_EXTENSIONS.includes(ext as any) ? ext : null;
}

export function isAllowedAudioFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large. Maximum size is 200 MB.`,
    };
  }
  const ext = getAudioFileExtension(file.name);
  const mimeOk = file.type && ALLOWED_AUDIO_MIME_TYPES.has(file.type);
  const extOk = !!ext;

  // Accept if extension is in allowed list (some browsers report empty/wrong MIME)
  if (extOk) return { valid: true };
  if (mimeOk) return { valid: true };
  return {
    valid: false,
    error: `Invalid audio format. Allowed: ${ALLOWED_AUDIO_EXTENSIONS.join(", ").toUpperCase()} (MP3, M4A, WAV, WebM, OGG, FLAC).`,
  };
}

/** For use in &lt;input accept=&quot;...&quot;&gt; */
export const AUDIO_ACCEPT = ".mp3,.m4a,.aac,.wav,.webm,.ogg,.oga,.flac,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/webm,audio/ogg,audio/flac";
