-- Phase 3: Authenticity Layer - AI Action Log
-- Tracks all AI operations for transparency and provenance

CREATE TABLE public.ai_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'transcribe', 'remove_fillers', 'sync_captions', 'export', etc.
  action_details JSONB, -- Additional details about the action
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_action_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own action logs
CREATE POLICY "Users can view their own AI actions"
ON public.ai_action_log
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create action logs for their projects
CREATE POLICY "Users can create AI action logs"
ON public.ai_action_log
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM projects
    WHERE projects.id = ai_action_log.project_id
    AND projects.user_id = auth.uid()
  )
);

-- Index for faster queries
CREATE INDEX idx_ai_action_log_project ON public.ai_action_log(project_id);
CREATE INDEX idx_ai_action_log_user ON public.ai_action_log(user_id);