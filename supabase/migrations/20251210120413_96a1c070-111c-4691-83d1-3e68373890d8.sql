-- Insight Sources (Firecrawl + RSS feeds)
CREATE TABLE public.insight_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('firecrawl', 'rss')),
  url TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  creator_type_tags TEXT[] DEFAULT '{}',
  topic_tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  use_transcripts BOOLEAN DEFAULT false,
  last_fetch_at TIMESTAMPTZ,
  fetch_frequency_hours INTEGER DEFAULT 24,
  documents_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Insight Documents (scraped/ingested content)
CREATE TABLE public.insight_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.insight_sources(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ,
  content_markdown TEXT,
  content_summary TEXT,
  
  -- AI-generated structured data
  key_points JSONB DEFAULT '[]',
  benchmarks JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  applicable_metrics TEXT[] DEFAULT '{}',
  
  -- Taxonomy
  tags TEXT[] DEFAULT '{}',
  creator_type_tags TEXT[] DEFAULT '{}',
  topic_tags TEXT[] DEFAULT '{}',
  
  -- Processing status
  is_processed BOOLEAN DEFAULT false,
  processing_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX idx_insight_documents_source_id ON public.insight_documents(source_id);
CREATE INDEX idx_insight_documents_applicable_metrics ON public.insight_documents USING GIN(applicable_metrics);
CREATE INDEX idx_insight_documents_tags ON public.insight_documents USING GIN(tags);
CREATE INDEX idx_insight_documents_creator_type_tags ON public.insight_documents USING GIN(creator_type_tags);
CREATE INDEX idx_insight_documents_published_at ON public.insight_documents(published_at DESC);
CREATE INDEX idx_insight_sources_type ON public.insight_sources(type);
CREATE INDEX idx_insight_sources_is_active ON public.insight_sources(is_active);

-- Enable RLS
ALTER TABLE public.insight_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insight_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for insight_sources
CREATE POLICY "Admins can manage insight sources"
ON public.insight_sources FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view active sources"
ON public.insight_sources FOR SELECT
USING (is_active = true);

-- RLS Policies for insight_documents
CREATE POLICY "Admins can manage insight documents"
ON public.insight_documents FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view processed documents"
ON public.insight_documents FOR SELECT
USING (is_processed = true);

-- Update trigger for updated_at
CREATE TRIGGER update_insight_sources_updated_at
BEFORE UPDATE ON public.insight_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insight_documents_updated_at
BEFORE UPDATE ON public.insight_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial Firecrawl sources (creator economy)
INSERT INTO public.insight_sources (name, type, url, tags, creator_type_tags, topic_tags, is_active) VALUES
('Linktree Creator Blog', 'firecrawl', 'https://linktr.ee/blog', ARRAY['creator-economy', 'monetization'], ARRAY['creator'], ARRAY['analytics', 'monetization', 'social'], true),
('HubSpot Marketing Blog', 'firecrawl', 'https://blog.hubspot.com/marketing', ARRAY['creator-economy', 'marketing'], ARRAY['creator', 'agency'], ARRAY['content', 'performance', 'analytics'], true),
('ConvertKit Creator Blog', 'firecrawl', 'https://convertkit.com/resources/blog', ARRAY['creator-economy', 'email'], ARRAY['creator'], ARRAY['monetization', 'audience', 'newsletter'], true),
('The Tilt', 'firecrawl', 'https://www.thetilt.com/', ARRAY['creator-economy', 'strategy'], ARRAY['creator'], ARRAY['business', 'growth', 'content'], true);

-- Seed initial podcast sources
INSERT INTO public.insight_sources (name, type, url, tags, creator_type_tags, topic_tags, is_active) VALUES
('DemandSage Podcast Stats', 'firecrawl', 'https://www.demandsage.com/podcast-statistics/', ARRAY['podcast', 'statistics'], ARRAY['podcaster'], ARRAY['benchmarks', 'industry', 'trends'], true),
('Buzzsprout Blog', 'firecrawl', 'https://www.buzzsprout.com/blog', ARRAY['podcast', 'education'], ARRAY['podcaster'], ARRAY['growth', 'distribution', 'monetization'], true),
('Podnews', 'firecrawl', 'https://podnews.net/', ARRAY['podcast', 'news'], ARRAY['podcaster'], ARRAY['industry', 'trends', 'platforms'], true),
('Edison Research', 'firecrawl', 'https://www.edisonresearch.com/the-infinite-dial/', ARRAY['podcast', 'research'], ARRAY['podcaster'], ARRAY['listeners', 'demographics', 'behavior'], true);