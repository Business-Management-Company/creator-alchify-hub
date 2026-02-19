
-- Podcasts table
CREATE TABLE public.podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  author_email TEXT,
  website_url TEXT,
  rss_feed_url TEXT,
  image_url TEXT,
  language TEXT DEFAULT 'en',
  category TEXT,
  is_explicit BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.podcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own podcasts" ON public.podcasts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own podcasts" ON public.podcasts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own podcasts" ON public.podcasts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own podcasts" ON public.podcasts FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_podcasts_updated_at BEFORE UPDATE ON public.podcasts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Episodes table
CREATE TABLE public.episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT,
  file_size_bytes BIGINT,
  duration_seconds INTEGER,
  pub_date TIMESTAMPTZ,
  episode_number INTEGER,
  season_number INTEGER,
  guid TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own episodes" ON public.episodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own episodes" ON public.episodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own episodes" ON public.episodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own episodes" ON public.episodes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RSS imports log
CREATE TABLE public.rss_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  podcast_id UUID REFERENCES public.podcasts(id) ON DELETE SET NULL,
  rss_url TEXT NOT NULL,
  episodes_imported INTEGER DEFAULT 0,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.rss_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports" ON public.rss_imports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own imports" ON public.rss_imports FOR INSERT WITH CHECK (auth.uid() = user_id);
