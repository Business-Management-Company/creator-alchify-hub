-- ============================================================
-- Phase 1: Podcast schema consolidation (Lovable / Supabase)
-- Run this after existing migrations. Idempotent: safe if schema
-- came from 20260219204353 (user_id, image_url) or 20260219160000
-- (creator_id, cover_image_url). Ensures one canonical schema for
-- the app and edge functions.
-- ============================================================

-- --------------------------------------------------------
-- 1. PODCASTS: Normalize to user_id, image_url, status active
-- --------------------------------------------------------

DO $$
BEGIN
  -- Rename creator_id -> user_id if legacy column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'podcasts' AND column_name = 'creator_id'
  ) THEN
    ALTER TABLE public.podcasts RENAME COLUMN creator_id TO user_id;
  END IF;

  -- Rename cover_image_url -> image_url if legacy column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'podcasts' AND column_name = 'cover_image_url'
  ) THEN
    ALTER TABLE public.podcasts RENAME COLUMN cover_image_url TO image_url;
  END IF;

  -- Allow status 'active' (publicly visible). Drop old check then add new one.
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public' AND table_name = 'podcasts' AND constraint_name = 'podcasts_status_check'
  ) THEN
    ALTER TABLE public.podcasts DROP CONSTRAINT podcasts_status_check;
  END IF;
  ALTER TABLE public.podcasts ADD CONSTRAINT podcasts_status_check
    CHECK (status IN ('draft', 'active', 'published', 'archived'));

  -- Treat 'published' as 'active' for public visibility
  UPDATE public.podcasts SET status = 'active' WHERE status = 'published';
END $$;

-- Ensure default status is 'active' for new podcasts (optional; app may set explicitly)
ALTER TABLE public.podcasts ALTER COLUMN status SET DEFAULT 'active';

-- --------------------------------------------------------
-- 2. EPISODES: Allow multiple episodes per podcast; normalize columns
-- --------------------------------------------------------

-- Drop UNIQUE(podcast_id) so one podcast can have many episodes
ALTER TABLE public.episodes DROP CONSTRAINT IF EXISTS episodes_podcast_id_key;

-- Rename publish_date -> pub_date if legacy column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'episodes' AND column_name = 'publish_date'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'episodes' AND column_name = 'pub_date'
  ) THEN
    ALTER TABLE public.episodes RENAME COLUMN publish_date TO pub_date;
  END IF;
END $$;

-- Rename external_guid -> guid if legacy column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'episodes' AND column_name = 'external_guid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'episodes' AND column_name = 'guid'
  ) THEN
    ALTER TABLE public.episodes RENAME COLUMN external_guid TO guid;
  END IF;
END $$;

-- --------------------------------------------------------
-- 3. RLS: Ensure public can view podcasts with status = 'active'
-- --------------------------------------------------------

DROP POLICY IF EXISTS "Public can view published podcasts" ON public.podcasts;
CREATE POLICY "Public can view active podcasts"
  ON public.podcasts FOR SELECT
  USING (status = 'active');

-- Optional: keep "Creators can view own" if it referenced creator_id (now user_id)
-- No change needed if policy uses auth.uid() and column was renamed to user_id.
