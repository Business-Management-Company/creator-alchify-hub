-- Create enum for brief audience types
CREATE TYPE public.brief_audience AS ENUM ('ceo', 'board', 'investor', 'creator');

-- Create competitor sources table
CREATE TABLE public.competitor_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT NOT NULL, -- 'direct' or 'platform'
  scrape_selectors JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create daily briefs table
CREATE TABLE public.daily_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  audience brief_audience NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]', -- [{headline, detail, source, sentiment}]
  competitor_updates JSONB DEFAULT '[]', -- [{competitor, update, impact}]
  market_signals JSONB DEFAULT '[]', -- [{signal, relevance}]
  action_items JSONB DEFAULT '[]', -- [{item, priority}]
  raw_data JSONB DEFAULT '{}', -- Store scraped data for reference
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(brief_date, audience)
);

-- Create brief subscriptions for email delivery (future)
CREATE TABLE public.brief_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  audience brief_audience NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, audience)
);

-- Enable RLS
ALTER TABLE public.competitor_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitor_sources (admin only management, viewable by all authenticated)
CREATE POLICY "Admins can manage competitor sources"
ON public.competitor_sources FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view competitor sources"
ON public.competitor_sources FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for daily_briefs
CREATE POLICY "Admins can manage daily briefs"
ON public.daily_briefs FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view briefs"
ON public.daily_briefs FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for brief_subscriptions
CREATE POLICY "Users can manage own subscriptions"
ON public.brief_subscriptions FOR ALL
USING (auth.uid() = user_id);

-- Seed initial competitor sources
INSERT INTO public.competitor_sources (name, url, category) VALUES
-- Direct competitors
('Opus Clips', 'https://opus.pro', 'direct'),
('Descript', 'https://www.descript.com', 'direct'),
('Riverside', 'https://riverside.fm', 'direct'),
('Restream', 'https://restream.io', 'direct'),
('Kapwing', 'https://www.kapwing.com', 'direct'),
('Cutclip', 'https://cutclip.ai', 'direct'),
-- Platforms
('YouTube Creator Blog', 'https://blog.youtube', 'platform'),
('Spotify for Creators', 'https://creators.spotify.com', 'platform'),
('TikTok Newsroom', 'https://newsroom.tiktok.com', 'platform'),
('Substack', 'https://on.substack.com', 'platform');

-- Add updated_at trigger for competitor_sources
CREATE TRIGGER update_competitor_sources_updated_at
BEFORE UPDATE ON public.competitor_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();