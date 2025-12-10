-- Create task_watchers table to track who is watching a task
CREATE TABLE public.task_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_watchers ENABLE ROW LEVEL SECURITY;

-- Admins can manage all watchers
CREATE POLICY "Admins can manage all task watchers"
ON public.task_watchers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Users can view watchers for tasks they can see
CREATE POLICY "Users can view watchers for visible tasks"
ON public.task_watchers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM tasks t
    WHERE t.id = task_watchers.task_id
    AND (t.assignee_id = auth.uid() OR t.creator_id = auth.uid())
  )
  OR user_id = auth.uid()
);

-- Users can watch/unwatch tasks they can see
CREATE POLICY "Users can manage own watch status"
ON public.task_watchers FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable realtime for watchers
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_watchers;