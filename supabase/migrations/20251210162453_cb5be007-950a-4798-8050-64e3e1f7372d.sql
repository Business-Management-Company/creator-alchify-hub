-- Add color column to task_statuses
ALTER TABLE public.task_statuses ADD COLUMN color TEXT DEFAULT '#6b7280';

-- Add color column to task_priorities  
ALTER TABLE public.task_priorities ADD COLUMN color TEXT DEFAULT '#6b7280';

-- Update default colors for existing statuses
UPDATE public.task_statuses SET color = '#94a3b8' WHERE slug = 'not_started';
UPDATE public.task_statuses SET color = '#3b82f6' WHERE slug = 'in_progress';
UPDATE public.task_statuses SET color = '#ef4444' WHERE slug = 'blocked';
UPDATE public.task_statuses SET color = '#f59e0b' WHERE slug = 'in_review';
UPDATE public.task_statuses SET color = '#22c55e' WHERE slug = 'completed';

-- Update default colors for existing priorities
UPDATE public.task_priorities SET color = '#ef4444' WHERE code = 'P0';
UPDATE public.task_priorities SET color = '#f97316' WHERE code = 'P1';
UPDATE public.task_priorities SET color = '#3b82f6' WHERE code = 'P2';
UPDATE public.task_priorities SET color = '#94a3b8' WHERE code = 'P3';