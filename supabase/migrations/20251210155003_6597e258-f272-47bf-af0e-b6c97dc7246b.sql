-- Create task_assignees junction table for multi-assignee support
CREATE TABLE public.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT task_assignees_unique UNIQUE (task_id, user_id)
);

-- Create indexes
CREATE INDEX idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX idx_task_assignees_user ON public.task_assignees(user_id);

-- Enable RLS
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage all task assignees"
ON public.task_assignees
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view assignees for their tasks"
ON public.task_assignees
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND (t.assignee_id = auth.uid() OR t.creator_id = auth.uid())
  )
  OR user_id = auth.uid()
);

-- Create user_preferences table for column order persistence
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT user_preferences_unique UNIQUE (user_id, preference_key)
);

CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
ON public.user_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Migrate existing assignee_id data to task_assignees
INSERT INTO public.task_assignees (task_id, user_id, created_at)
SELECT id, assignee_id, created_at
FROM public.tasks
WHERE assignee_id IS NOT NULL
ON CONFLICT DO NOTHING;