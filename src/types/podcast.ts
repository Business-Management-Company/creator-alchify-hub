// Type definitions matching the actual database schema

export interface Podcast {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  author: string | null;
  author_email: string | null;
  website_url: string | null;
  rss_feed_url: string | null;
  image_url: string | null;
  language: string;
  category: string | null;
  is_explicit: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Episode {
  id: string;
  podcast_id: string;
  user_id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  pub_date: string | null;
  episode_number: number | null;
  season_number: number | null;
  guid: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface RssImport {
  id: string;
  user_id: string;
  podcast_id: string | null;
  rss_url: string;
  episodes_imported: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface Transcription {
  id: string;
  episode_id: string;
  content: string | null;
  segments: any | null;
  avg_confidence: number | null;
  word_count: number | null;
  created_at: string;
}

// Insert types
export type PodcastInsert = Partial<Omit<Podcast, "id" | "created_at" | "updated_at">> & {
  title: string;
  user_id: string;
};

export type EpisodeInsert = Partial<Omit<Episode, "id" | "created_at" | "updated_at">> & {
  podcast_id: string;
  user_id: string;
  title: string;
};

export type RssImportInsert = Partial<Omit<RssImport, "id" | "created_at">> & {
  user_id: string;
  rss_url: string;
};

// Update types
export type PodcastUpdate = Partial<PodcastInsert>;
export type EpisodeUpdate = Partial<EpisodeInsert>;

// Podcast with related data
export type PodcastWithEpisodes = Podcast & {
  episodes: Episode[];
  rss_import?: RssImport | null;
};

// Episode with related data
export type EpisodeWithTranscription = Episode & {
  transcription?: Transcription | null;
};

// Apple Podcasts categories
export const PODCAST_CATEGORIES = [
  "Arts", "Business", "Comedy", "Education", "Fiction", "Government",
  "Health & Fitness", "History", "Kids & Family", "Leisure", "Music",
  "News", "Religion & Spirituality", "Science", "Society & Culture",
  "Sports", "Technology", "True Crime", "TV & Film",
] as const;

export type PodcastCategory = (typeof PODCAST_CATEGORIES)[number];

export const PODCAST_LANGUAGES = [
  { code: "en", label: "English" }, { code: "es", label: "Spanish" },
  { code: "fr", label: "French" }, { code: "de", label: "German" },
  { code: "pt", label: "Portuguese" }, { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" }, { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" }, { code: "hi", label: "Hindi" },
  { code: "ur", label: "Urdu" },
] as const;

export const EPISODE_TYPES = [
  { value: "full", label: "Full Episode" },
  { value: "trailer", label: "Trailer" },
  { value: "bonus", label: "Bonus" },
] as const;

export const PODCAST_STATUSES = ["draft", "active", "archived"] as const;
export const EPISODE_STATUSES = ["draft", "processing", "published", "scheduled"] as const;
