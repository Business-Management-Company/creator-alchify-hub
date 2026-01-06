/**
 * Storage Service - Backend-agnostic file storage layer
 * 
 * This service abstracts all file storage operations and can be
 * backed by any storage provider (S3, local, etc.)
 */

import { authService } from './auth-service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface UploadResult {
  url: string;
  path: string;
  size: number;
}

export interface StorageError {
  message: string;
  code?: string;
}

/**
 * Upload a file to storage
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: {
    upsert?: boolean;
    onProgress?: (percent: number) => void;
  }
): Promise<{ data: UploadResult | null; error: StorageError | null }> {
  const token = authService.getAccessToken();
  if (!token) {
    return { data: null, error: { message: 'Not authenticated' } };
  }

  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);
    if (options?.upsert) {
      formData.append('upsert', 'true');
    }

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100);
        options.onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ data, error: null });
        } catch {
          resolve({ data: null, error: { message: 'Invalid response' } });
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          resolve({ data: null, error: { message: errorData.message || `Upload failed: ${xhr.status}` } });
        } catch {
          resolve({ data: null, error: { message: `Upload failed with status ${xhr.status}` } });
        }
      }
    });

    xhr.addEventListener('error', () => {
      resolve({ data: null, error: { message: 'Network error during upload' } });
    });

    xhr.addEventListener('abort', () => {
      resolve({ data: null, error: { message: 'Upload was cancelled' } });
    });

    xhr.open('POST', `${API_BASE_URL}/storage/upload`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}

/**
 * Get a signed URL for a file (for private files)
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<{ data: { signedUrl: string } | null; error: StorageError | null }> {
  const token = authService.getAccessToken();
  if (!token) {
    return { data: null, error: { message: 'Not authenticated' } };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/storage/signed-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bucket, path, expiresIn }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: { message: errorData.message || 'Failed to get signed URL' } };
    }

    const data = await response.json();
    return { data: { signedUrl: data.signedUrl }, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Unknown error' } };
  }
}

/**
 * Get a public URL for a file (for public files)
 */
export async function getPublicUrl(
  bucket: string,
  path: string
): Promise<{ data: { publicUrl: string } | null; error: StorageError | null }> {
  const token = authService.getAccessToken();
  if (!token) {
    return { data: null, error: { message: 'Not authenticated' } };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/storage/public-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bucket, path }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { data: null, error: { message: errorData.message || 'Failed to get public URL' } };
    }

    const data = await response.json();
    return { data: { publicUrl: data.publicUrl }, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : 'Unknown error' } };
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: string,
  path: string
): Promise<{ error: StorageError | null }> {
  const token = authService.getAccessToken();
  if (!token) {
    return { error: { message: 'Not authenticated' } };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/storage/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ bucket, path }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { error: { message: errorData.message || 'Failed to delete file' } };
    }

    return { error: null };
  } catch (error) {
    return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
  }
}

// Export convenience object for common buckets
export const storage = {
  mediaUploads: {
    upload: (path: string, file: File, options?: { upsert?: boolean; onProgress?: (percent: number) => void }) =>
      uploadFile('media-uploads', path, file, options),
    getSignedUrl: (path: string, expiresIn?: number) =>
      getSignedUrl('media-uploads', path, expiresIn),
    getPublicUrl: (path: string) =>
      getPublicUrl('media-uploads', path),
    delete: (path: string) =>
      deleteFile('media-uploads', path),
  },
  avatars: {
    upload: (path: string, file: File, options?: { upsert?: boolean }) =>
      uploadFile('avatars', path, file, options),
    getPublicUrl: (path: string) =>
      getPublicUrl('avatars', path),
    delete: (path: string) =>
      deleteFile('avatars', path),
  },
  creatorAssets: {
    upload: (path: string, file: File, options?: { upsert?: boolean }) =>
      uploadFile('creator-assets', path, file, options),
    getPublicUrl: (path: string) =>
      getPublicUrl('creator-assets', path),
    delete: (path: string) =>
      deleteFile('creator-assets', path),
  },
  welcomeVideos: {
    getPublicUrl: (path: string) =>
      getPublicUrl('welcome-videos', path),
  },
};
