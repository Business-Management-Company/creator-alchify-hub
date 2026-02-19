-- ============================================================
-- Alchify Podcast Platform — Core Tables
-- Creates: podcasts, episodes, rss_imports, transcriptions
-- ============================================================

-- --------------------------------------------------------
-- 1. PODCASTS — A show/channel owned by a creator
-- --------------------------------------------------------
CREATE TABLE public.podcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    cover_image_url TEXT,
    language TEXT DEFAULT 'en',
    category TEXT,
    is_explicit BOOLEAN DEFAULT false,
    rss_feed_url TEXT,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    website_url TEXT,
    author_name TEXT,
    author_email TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT podcasts_slug_unique UNIQUE (slug),
    CONSTRAINT podcasts_status_check CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT podcasts_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR slug ~ '^[a-z0-9]$')
);

-- Indexes
CREATE INDEX idx_podcasts_creator_id ON public.podcasts(creator_id);
CREATE INDEX idx_podcasts_slug ON public.podcasts(slug);
CREATE INDEX idx_podcasts_status ON public.podcasts(status);

-- Updated_at trigger
CREATE TRIGGER update_podcasts_updated_at
  BEFORE UPDATE ON public.podcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published podcasts"
  ON public.podcasts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Creators can view own podcasts"
  ON public.podcasts FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can create podcasts"
  ON public.podcasts FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update own podcasts"
  ON public.podcasts FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Creators can delete own podcasts"
  ON public.podcasts FOR DELETE
  USING (creator_id = auth.uid());


-- --------------------------------------------------------
-- 2. EPISODES — Individual podcast episodes
-- --------------------------------------------------------
CREATE TABLE public.episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    audio_url TEXT,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    episode_number INTEGER,
    season_number INTEGER,
    episode_type TEXT NOT NULL DEFAULT 'full',
    is_explicit BOOLEAN DEFAULT false,
    publish_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft',
    source TEXT NOT NULL DEFAULT 'upload',
    external_guid TEXT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    show_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT episodes_type_check CHECK (episode_type IN ('full', 'trailer', 'bonus')),
    CONSTRAINT episodes_status_check CHECK (status IN ('draft', 'processing', 'published', 'scheduled')),
    CONSTRAINT episodes_source_check CHECK (source IN ('upload', 'rss_import', 'recorded'))
);

-- Indexes
CREATE INDEX idx_episodes_podcast_id ON public.episodes(podcast_id);
CREATE INDEX idx_episodes_status ON public.episodes(status);
CREATE INDEX idx_episodes_publish_date ON public.episodes(publish_date DESC);
CREATE INDEX idx_episodes_external_guid ON public.episodes(external_guid);
CREATE INDEX idx_episodes_project_id ON public.episodes(project_id);

-- Updated_at trigger
CREATE TRIGGER update_episodes_updated_at
  BEFORE UPDATE ON public.episodes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published episodes"
  ON public.episodes FOR SELECT
  USING (
    status = 'published'
    AND podcast_id IN (SELECT id FROM public.podcasts WHERE status = 'published')
  );

CREATE POLICY "Creators can view own episodes"
  ON public.episodes FOR SELECT
  USING (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can create episodes"
  ON public.episodes FOR INSERT
  WITH CHECK (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can update own episodes"
  ON public.episodes FOR UPDATE
  USING (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can delete own episodes"
  ON public.episodes FOR DELETE
  USING (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );


-- --------------------------------------------------------
-- 3. RSS_IMPORTS — Tracks RSS feed import/sync jobs
-- --------------------------------------------------------
CREATE TABLE public.rss_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
    feed_url TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    sync_status TEXT NOT NULL DEFAULT 'idle',
    error_message TEXT,
    auto_sync BOOLEAN DEFAULT false,
    episodes_imported INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT rss_imports_status_check CHECK (sync_status IN ('idle', 'syncing', 'completed', 'error'))
);

-- Indexes
CREATE INDEX idx_rss_imports_podcast_id ON public.rss_imports(podcast_id);
CREATE INDEX idx_rss_imports_auto_sync ON public.rss_imports(auto_sync) WHERE auto_sync = true;

-- Updated_at trigger
CREATE TRIGGER update_rss_imports_updated_at
  BEFORE UPDATE ON public.rss_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.rss_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own rss_imports"
  ON public.rss_imports FOR SELECT
  USING (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can create rss_imports"
  ON public.rss_imports FOR INSERT
  WITH CHECK (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can update own rss_imports"
  ON public.rss_imports FOR UPDATE
  USING (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can delete own rss_imports"
  ON public.rss_imports FOR DELETE
  USING (
    podcast_id IN (SELECT id FROM public.podcasts WHERE creator_id = auth.uid())
  );


-- --------------------------------------------------------
-- 4. TRANSCRIPTIONS — AI-generated transcripts for episodes
-- --------------------------------------------------------
CREATE TABLE public.transcriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID NOT NULL REFERENCES public.episodes(id) ON DELETE CASCADE,
    full_text TEXT,
    segments JSONB,
    language TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    model_used TEXT,
    word_count INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT transcriptions_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Indexes
CREATE INDEX idx_transcriptions_episode_id ON public.transcriptions(episode_id);
CREATE INDEX idx_transcriptions_status ON public.transcriptions(status);

-- Updated_at trigger
CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON public.transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS (inherit access from episode → podcast → creator)
ALTER TABLE public.transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view transcriptions of published episodes"
  ON public.transcriptions FOR SELECT
  USING (
    episode_id IN (
      SELECT e.id FROM public.episodes e
      JOIN public.podcasts p ON e.podcast_id = p.id
      WHERE e.status = 'published' AND p.status = 'published'
    )
  );

CREATE POLICY "Creators can manage own transcriptions"
  ON public.transcriptions FOR ALL
  USING (
    episode_id IN (
      SELECT e.id FROM public.episodes e
      JOIN public.podcasts p ON e.podcast_id = p.id
      WHERE p.creator_id = auth.uid()
    )
  );


-- --------------------------------------------------------
-- 5. STORAGE BUCKETS
-- --------------------------------------------------------

-- Podcast audio files (MP3/M4A)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'podcast-audio',
  'podcast-audio',
  true,
  209715200, -- 200MB
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Podcast cover art
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'podcast-covers',
  'podcast-covers',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for podcast-audio
CREATE POLICY "Public read podcast audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'podcast-audio');

CREATE POLICY "Creators upload podcast audio"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'podcast-audio'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Creators delete own podcast audio"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'podcast-audio'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage policies for podcast-covers
CREATE POLICY "Public read podcast covers"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'podcast-covers');

CREATE POLICY "Creators upload podcast covers"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'podcast-covers'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Creators delete own podcast covers"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'podcast-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
