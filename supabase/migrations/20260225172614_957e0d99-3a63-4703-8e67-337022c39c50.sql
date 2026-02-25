
-- Track which streaming platforms each podcast is distributed to
CREATE TABLE public.podcast_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES public.podcasts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- 'spotify', 'apple', 'google', 'amazon', 'youtube_music', etc.
  status TEXT NOT NULL DEFAULT 'not_submitted', -- 'not_submitted', 'submitted', 'live', 'rejected'
  submitted_at TIMESTAMPTZ,
  live_url TEXT, -- URL to the podcast on the platform
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(podcast_id, platform)
);

-- Enable RLS
ALTER TABLE public.podcast_distributions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own distributions
CREATE POLICY "Users can view own distributions"
ON public.podcast_distributions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own distributions"
ON public.podcast_distributions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own distributions"
ON public.podcast_distributions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own distributions"
ON public.podcast_distributions FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_podcast_distributions_updated_at
BEFORE UPDATE ON public.podcast_distributions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
