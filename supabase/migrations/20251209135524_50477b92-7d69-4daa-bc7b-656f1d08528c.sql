-- Add policy to allow public read access to welcome-videos bucket
CREATE POLICY "Public can view welcome videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'welcome-videos');