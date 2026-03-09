-- Add storage RLS policies for media-uploads bucket
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read their own uploads"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'media-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'media-uploads' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Service role can read all media uploads"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'media-uploads');
