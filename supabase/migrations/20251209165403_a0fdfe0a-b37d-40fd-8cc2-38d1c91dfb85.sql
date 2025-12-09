-- Create policy to allow public access to welcome-videos bucket
CREATE POLICY "Allow public read access on welcome-videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'welcome-videos');