// ========== SHARED INSIGHT TYPES ==========
// Used by both frontend and backend (insight-engine-v2)

export interface InsightResponse {
  metricKey: string;
  title: string;
  summary: string;
  insightBullets: string[];
  recommendations: string[];
  industryContext?: string;
  focusAreas?: string[];
  sourceSnippets?: {
    label: string;
    snippet: string;
    sourceType: 'firecrawl' | 'rss' | 'internal';
  }[];
}

// Metric key constants for dashboard tiles
export const METRIC_KEYS = {
  TIME_SAVED: 'time_saved_hours',
  PROJECTS: 'projects_count',
  EXPORTS: 'exports_count',
  ACCURACY: 'avg_accuracy',
  FILLERS_REMOVED: 'fillers_removed',
  PAUSES_CUT: 'pauses_cut',
  AUDIO_ENHANCED: 'audio_enhanced_percent',
  CLIPS_CREATED: 'clips_created',
  WORDS_TRANSCRIBED: 'words_transcribed',
  CAPTIONS_SYNCED: 'captions_synced',
} as const;

export type MetricKey = typeof METRIC_KEYS[keyof typeof METRIC_KEYS];

// Mapping from display labels to metric keys
export const LABEL_TO_METRIC_KEY: Record<string, MetricKey> = {
  'Time Saved': METRIC_KEYS.TIME_SAVED,
  'Projects': METRIC_KEYS.PROJECTS,
  'Exports': METRIC_KEYS.EXPORTS,
  'Avg Accuracy': METRIC_KEYS.ACCURACY,
  'Fillers Removed': METRIC_KEYS.FILLERS_REMOVED,
  'Pauses Cut': METRIC_KEYS.PAUSES_CUT,
  'Audio Enhanced': METRIC_KEYS.AUDIO_ENHANCED,
  'Clips Created': METRIC_KEYS.CLIPS_CREATED,
  'Words Transcribed': METRIC_KEYS.WORDS_TRANSCRIBED,
  'Captions Synced': METRIC_KEYS.CAPTIONS_SYNCED,
};

// Request shape for insight engine
export interface InsightRequest {
  metricKey: MetricKey;
  metricValue: number;
  timeRange?: {
    from: string;
    to: string;
  };
  userContext?: {
    userId: string;
    plan: string;
    contentType?: 'podcast' | 'video' | 'mixed';
    weeklyUploads?: number;
  };
}
