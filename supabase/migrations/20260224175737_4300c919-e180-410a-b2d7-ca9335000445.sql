
-- Allow anyone to view active/published podcasts publicly
CREATE POLICY "Anyone can view active podcasts"
ON public.podcasts
FOR SELECT
USING (status = 'active');

-- Allow anyone to view published episodes of active podcasts
CREATE POLICY "Anyone can view published episodes"
ON public.episodes
FOR SELECT
USING (status = 'published');
