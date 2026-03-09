-- Ensure creator-assets bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-assets', 'creator-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts, then recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can view creator-assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can upload to creator-assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can update creator-assets" ON storage.objects;
  DROP POLICY IF EXISTS "Authenticated users can delete from creator-assets" ON storage.objects;
END$$;

CREATE POLICY "Anyone can view creator-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-assets');

CREATE POLICY "Authenticated users can upload to creator-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'creator-assets');

CREATE POLICY "Authenticated users can update creator-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'creator-assets');

CREATE POLICY "Authenticated users can delete from creator-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'creator-assets');