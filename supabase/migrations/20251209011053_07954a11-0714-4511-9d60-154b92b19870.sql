-- Drop the existing constraint and add 'alchifying' as a valid status
ALTER TABLE public.projects DROP CONSTRAINT projects_status_check;

ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
CHECK (status = ANY (ARRAY['uploaded'::text, 'alchifying'::text, 'transcribing'::text, 'editing'::text, 'ready'::text, 'exported'::text]));