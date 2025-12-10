-- Create storage bucket for creator profile assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('creator-assets', 'creator-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'creator-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'creator-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public can view creator assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'creator-assets');