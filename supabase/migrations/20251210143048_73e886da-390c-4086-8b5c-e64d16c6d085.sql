-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'blocked', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  area TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task_comments table
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Tasks RLS policies
CREATE POLICY "Admins can manage all tasks"
ON public.tasks FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view tasks assigned to them"
ON public.tasks FOR SELECT
USING (auth.uid() = assignee_id);

CREATE POLICY "Users can view tasks they created"
ON public.tasks FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Users can update tasks assigned to them"
ON public.tasks FOR UPDATE
USING (auth.uid() = assignee_id);

CREATE POLICY "Users can update tasks they created"
ON public.tasks FOR UPDATE
USING (auth.uid() = creator_id);

-- Task comments RLS policies
CREATE POLICY "Admins can manage all comments"
ON public.task_comments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view comments on visible tasks"
ON public.task_comments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tasks t 
  WHERE t.id = task_id 
  AND (t.assignee_id = auth.uid() OR t.creator_id = auth.uid())
));

CREATE POLICY "Users can create comments on visible tasks"
ON public.task_comments FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM public.tasks t 
    WHERE t.id = task_id 
    AND (t.assignee_id = auth.uid() OR t.creator_id = auth.uid())
  )
);

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications"
ON public.notifications FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Trigger to update updated_at on tasks
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX idx_tasks_creator ON public.tasks(creator_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_task_comments_task ON public.task_comments(task_id);