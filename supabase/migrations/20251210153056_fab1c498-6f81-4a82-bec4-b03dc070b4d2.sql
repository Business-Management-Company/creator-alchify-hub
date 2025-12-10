-- Create task_statuses table
CREATE TABLE public.task_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create task_priorities table  
CREATE TABLE public.task_priorities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_default BOOLEAN DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_priorities ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_statuses
CREATE POLICY "Admins can manage task statuses" ON public.task_statuses
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view task statuses" ON public.task_statuses
FOR SELECT USING (true);

-- RLS policies for task_priorities
CREATE POLICY "Admins can manage task priorities" ON public.task_priorities
FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view task priorities" ON public.task_priorities
FOR SELECT USING (true);

-- Add new columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN status_id UUID REFERENCES public.task_statuses(id),
ADD COLUMN priority_id UUID REFERENCES public.task_priorities(id),
ADD COLUMN release_target TEXT DEFAULT 'Backlog' CHECK (release_target IN ('Dec-15-Full-Test', 'Jan-1-Alpha', 'Backlog'));

-- Seed default statuses
INSERT INTO public.task_statuses (name, slug, sort_order, is_default) VALUES
('Not Started', 'not-started', 1, true),
('In Progress', 'in-progress', 2, false),
('Blocked', 'blocked', 3, false),
('In Review', 'in-review', 4, false),
('Completed', 'completed', 5, false);

-- Seed default priorities
INSERT INTO public.task_priorities (name, code, sort_order, is_default) VALUES
('P0 – Critical', 'P0', 1, true),
('P1 – High', 'P1', 2, false),
('P2 – Normal', 'P2', 3, false),
('P3 – Nice to Have', 'P3', 4, false);