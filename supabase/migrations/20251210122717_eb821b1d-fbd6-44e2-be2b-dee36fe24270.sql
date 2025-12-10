-- Create creator_profiles table
CREATE TABLE public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  tagline TEXT,
  bio TEXT,
  avatar_url TEXT,
  hero_image_url TEXT,
  primary_color TEXT,
  accent_color TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  highlight_metrics JSONB DEFAULT '[]'::jsonb,
  featured_project_ids TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add constraint for URL-safe handle
ALTER TABLE public.creator_profiles 
ADD CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$' OR handle ~ '^[a-z0-9]$');

-- Enable RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view public profiles
CREATE POLICY "Anyone can view public profiles"
ON public.creator_profiles
FOR SELECT
USING (is_public = true);

-- Users can view their own profile regardless of public status
CREATE POLICY "Users can view own profile"
ON public.creator_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
ON public.creator_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.creator_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
ON public.creator_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_creator_profiles_updated_at
BEFORE UPDATE ON public.creator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();