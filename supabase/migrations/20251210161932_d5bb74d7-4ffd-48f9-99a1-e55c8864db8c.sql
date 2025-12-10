-- Create task_sections table for organizing tasks into groups
CREATE TABLE public.task_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add section_id to tasks table
ALTER TABLE public.tasks ADD COLUMN section_id UUID REFERENCES public.task_sections(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.task_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_sections
CREATE POLICY "Admins can manage task sections"
ON public.task_sections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Authenticated users can view task sections"
ON public.task_sections FOR SELECT
USING (true);

-- Insert default sections
INSERT INTO public.task_sections (name, color, sort_order) VALUES
  ('To Do', '#ef4444', 0),
  ('In Progress', '#f59e0b', 1),
  ('Done', '#22c55e', 2);