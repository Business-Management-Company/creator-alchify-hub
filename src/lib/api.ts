import { authService } from "./auth-service";

/**
 * Base URL for the Node.js backend API
 * Update this to your actual backend URL
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

/**
 * Get the current user's JWT token from auth service
 */
function getAuthToken(): string | null {
  return authService.getAccessToken();
}

/**
 * Make an authenticated API request to the Node.js backend
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const token = getAuthToken();
    
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("Unknown error occurred") 
    };
  }
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  params?: Record<string, string>
): Promise<{ data: T | null; error: Error | null }> {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url = `${endpoint}?${searchParams.toString()}`;
  }
  return apiRequest<T>(url, {
    method: "GET",
  });
}

/**
 * PUT request helper
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T = unknown>(
  endpoint: string,
  body: Record<string, unknown>
): Promise<{ data: T | null; error: Error | null }> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(
  endpoint: string
): Promise<{ data: T | null; error: Error | null }> {
  return apiRequest<T>(endpoint, {
    method: "DELETE",
  });
}
