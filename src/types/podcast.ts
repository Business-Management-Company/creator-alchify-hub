import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

// Row types (what you get back from queries)
export type Podcast = Tables<"podcasts">;
export type Episode = Tables<"episodes">;
export type RssImport = Tables<"rss_imports">;
export type Transcription = Tables<"transcriptions">;

// Insert types (what you send for creation)
export type PodcastInsert = TablesInsert<"podcasts">;
export type EpisodeInsert = TablesInsert<"episodes">;
export type RssImportInsert = TablesInsert<"rss_imports">;

// Update types (what you send for updates)
export type PodcastUpdate = TablesUpdate<"podcasts">;
export type EpisodeUpdate = TablesUpdate<"episodes">;
export type RssImportUpdate = TablesUpdate<"rss_imports">;

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
    "Arts",
    "Business",
    "Comedy",
    "Education",
    "Fiction",
    "Government",
    "Health & Fitness",
    "History",
    "Kids & Family",
    "Leisure",
    "Music",
    "News",
    "Religion & Spirituality",
    "Science",
    "Society & Culture",
    "Sports",
    "Technology",
    "True Crime",
    "TV & Film",
] as const;

export type PodcastCategory = (typeof PODCAST_CATEGORIES)[number];

// Languages
export const PODCAST_LANGUAGES = [
    { code: "en", label: "English" },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "pt", label: "Portuguese" },
    { code: "ja", label: "Japanese" },
    { code: "ko", label: "Korean" },
    { code: "zh", label: "Chinese" },
    { code: "ar", label: "Arabic" },
    { code: "hi", label: "Hindi" },
    { code: "ur", label: "Urdu" },
] as const;

// Episode types
export const EPISODE_TYPES = [
    { value: "full", label: "Full Episode" },
    { value: "trailer", label: "Trailer" },
    { value: "bonus", label: "Bonus" },
] as const;

// Status types
export const PODCAST_STATUSES = ["draft", "published", "archived"] as const;
export const EPISODE_STATUSES = ["draft", "processing", "published", "scheduled"] as const;
export const EPISODE_SOURCES = ["upload", "rss_import", "recorded"] as const;
