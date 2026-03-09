/**
 * Production-friendly URL helpers for podcasts.
 */

/** Public page URL for a podcast */
export function getPublicPodcastUrl(podcastId: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/podcast/${podcastId}`;
}

/**
 * RSS feed URL for Apple Podcasts, Spotify, etc.
 * Must be the direct URL that returns XML (not a browser redirect).
 * Apple's crawler fetches this URL and expects application/rss+xml.
 */
export function getRssFeedUrl(podcastId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/generate-rss?id=${encodeURIComponent(podcastId)}`;
}

/** Legacy /feed/ path (redirects in browser; use getRssFeedUrl for directory submission) */
export function getRssFeedPageUrl(podcastId: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : ""}/feed/${podcastId}`;
}

/** Internal Supabase function URL for the RSS feed (used by proxy) */
export function getRssFeedFunctionUrl(podcastId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/generate-rss?id=${podcastId}`;
}
