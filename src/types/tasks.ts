export type TaskStatus = 'backlog' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReleaseTarget = 'Dec-22-Full-Test' | 'Dec-28-Final-Testing' | 'Jan-1-Alpha';

export interface TaskStatusConfig {
  id: string;
  name: string;
  slug: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at?: string;
}

export interface TaskPriorityConfig {
  id: string;
  name: string;
  code: string;
  color: string;
  is_default: boolean;
  sort_order: number;
  created_at?: string;
}

export interface TaskAssignee {
  id: string;
  task_id: string;
  user_id: string;
  role: string | null;
  created_at: string;
  profile?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  status_id: string | null;
  priority_id: string | null;
  section_id: string | null;
  release_target: ReleaseTarget | null;
  due_date: string | null;
  area: string | null;
  creator_id: string;
  assignee_id: string | null; // Legacy, kept for compatibility
  linked_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  creator?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  assignee?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  // Multi-assignees
  assignees?: TaskAssignee[];
  // Config lookups
  status_config?: TaskStatusConfig | null;
  priority_config?: TaskPriorityConfig | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface Notification {
  id: string;
  user_id: string;
  task_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  backlog: { label: 'Backlog', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/20 text-blue-600' },
  blocked: { label: 'Blocked', color: 'bg-destructive/20 text-destructive' },
  done: { label: 'Done', color: 'bg-green-500/20 text-green-600' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'Medium', color: 'bg-blue-500/20 text-blue-600' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-600' },
  urgent: { label: 'Urgent', color: 'bg-destructive/20 text-destructive' },
};

export const AREA_OPTIONS = ['Product', 'Marketing', 'Operations', 'Finance', 'Other'];
