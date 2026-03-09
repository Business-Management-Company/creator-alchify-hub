/**
 * Production-friendly URL helpers for podcasts.
 * Uses the site origin (e.g. https://alchify.com) instead of raw Supabase function URLs.
 */

/** Public page URL for a podcast */
export function getPublicPodcastUrl(podcastId: string): string {
  return `${window.location.origin}/podcast/${podcastId}`;
}

/** RSS feed URL – uses a clean /feed/ path */
export function getRssFeedUrl(podcastId: string): string {
  return `${window.location.origin}/feed/${podcastId}`;
}

/** Internal Supabase function URL for the RSS feed (used by proxy) */
export function getRssFeedFunctionUrl(podcastId: string): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  return `${supabaseUrl}/functions/v1/generate-rss?id=${podcastId}`;
}
