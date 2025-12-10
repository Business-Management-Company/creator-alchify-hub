-- Create task filter configs table
CREATE TABLE public.task_filter_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  field TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('enum', 'date', 'number', 'boolean')),
  operator TEXT NOT NULL DEFAULT 'equals' CHECK (operator IN ('equals', 'not_equals', 'in', 'between', 'gte', 'lte', 'contains')),
  options JSONB DEFAULT '[]'::jsonb,
  visible_by_default BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_filter_configs ENABLE ROW LEVEL SECURITY;

-- Admins can manage filter configs
CREATE POLICY "Admins can manage task filter configs"
ON public.task_filter_configs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view filter configs
CREATE POLICY "Authenticated users can view filter configs"
ON public.task_filter_configs
FOR SELECT
USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_task_filter_configs_updated_at
BEFORE UPDATE ON public.task_filter_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default filters (read-only)
INSERT INTO public.task_filter_configs (label, slug, field, type, operator, options, visible_by_default, display_order, is_default) VALUES
('Status', 'status', 'status', 'enum', 'equals', '["backlog", "in_progress", "blocked", "done"]', true, 1, true),
('Priority', 'priority', 'priority', 'enum', 'equals', '["low", "medium", "high", "urgent"]', true, 2, true),
('Area', 'area', 'area', 'enum', 'equals', '["Product", "Marketing", "Operations", "Finance", "Other"]', true, 3, true),
('Due Date', 'due_date', 'due_date', 'date', 'between', '[]', true, 4, true);