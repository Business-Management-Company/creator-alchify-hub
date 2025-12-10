-- First update existing tasks with old values
UPDATE tasks SET release_target = 'Dec-22-Full-Test' WHERE release_target = 'Dec-15-Full-Test';
UPDATE tasks SET release_target = NULL WHERE release_target = 'Backlog';

-- Now drop the old check constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_release_target_check;

-- Add new constraint with updated values
ALTER TABLE tasks ADD CONSTRAINT tasks_release_target_check 
CHECK (release_target IS NULL OR release_target IN ('Dec-22-Full-Test', 'Dec-28-Final-Testing', 'Jan-1-Alpha'));