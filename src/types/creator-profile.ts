export interface SocialLinks {
  website?: string | null;
  email?: string | null;
  twitter?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  podcastRss?: string | null;
}

export interface HighlightMetric {
  key: string;
  label: string;
  value: string;
}

export interface CreatorProfile {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  tagline?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  hero_image_url?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  social_links: SocialLinks;
  highlight_metrics: HighlightMetric[];
  featured_project_ids: string[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatorProfileFormData {
  handle: string;
  display_name: string;
  tagline: string;
  bio: string;
  avatar_url: string;
  hero_image_url: string;
  primary_color: string;
  accent_color: string;
  social_links: SocialLinks;
  highlight_metrics: HighlightMetric[];
  is_public: boolean;
}
