-- Create a public bucket for welcome/marketing videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('welcome-videos', 'welcome-videos', true);

-- Allow public read access to welcome videos
CREATE POLICY "Welcome videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'welcome-videos');

-- Allow authenticated users with admin role to upload welcome videos
CREATE POLICY "Admins can upload welcome videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'welcome-videos' 
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
);

-- Allow admins to delete welcome videos
CREATE POLICY "Admins can delete welcome videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'welcome-videos' 
  AND auth.role() = 'authenticated'
  AND public.has_role(auth.uid(), 'admin')
);