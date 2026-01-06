import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment, TaskAssignee } from '@/types/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { apiPost, apiGet } from '@/lib/api';

async function enrichTasksWithProfiles(tasks: any[]) {
  if (!tasks.length) return [];
  
  const userIds = [...new Set([
    ...tasks.map(t => t.creator_id),
    ...tasks.map(t => t.assignee_id).filter(Boolean)
  ])];
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', userIds);
  
  // Fetch status and priority configs
  const statusIds = [...new Set(tasks.map(t => t.status_id).filter(Boolean))];
  const priorityIds = [...new Set(tasks.map(t => t.priority_id).filter(Boolean))];
  
  const [statusesRes, prioritiesRes] = await Promise.all([
    statusIds.length ? supabase.from('task_statuses').select('*').in('id', statusIds) : { data: [] },
    priorityIds.length ? supabase.from('task_priorities').select('*').in('id', priorityIds) : { data: [] },
  ]);
  
  // Fetch assignees from junction table
  const taskIds = tasks.map(t => t.id);
  const { data: assigneesData } = await supabase
    .from('task_assignees')
    .select('*')
    .in('task_id', taskIds);
  
  // Get unique assignee user_ids
  const assigneeUserIds = [...new Set((assigneesData || []).map(a => a.user_id))];
  const { data: assigneeProfiles } = assigneeUserIds.length 
    ? await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', assigneeUserIds)
    : { data: [] };
  
  const profileMap = new Map(profiles?.map(p => [p.user_id, p] as const) || []);
  const assigneeProfileMap = new Map((assigneeProfiles || []).map(p => [p.user_id, p] as const));
  const statusMap = new Map((statusesRes.data || []).map(s => [s.id, s] as const));
  const priorityMap = new Map((prioritiesRes.data || []).map(p => [p.id, p] as const));
  
  // Group assignees by task_id
  const assigneesByTask = new Map<string, TaskAssignee[]>();
  (assigneesData || []).forEach(a => {
    const list = assigneesByTask.get(a.task_id) || [];
    list.push({
      ...a,
      profile: assigneeProfileMap.get(a.user_id) || null,
    });
    assigneesByTask.set(a.task_id, list);
  });
  
  return tasks.map(task => ({
    ...task,
    creator: profileMap.get(task.creator_id) || null,
    assignee: task.assignee_id ? profileMap.get(task.assignee_id) || null : null,
    assignees: assigneesByTask.get(task.id) || [],
    status_config: task.status_id ? statusMap.get(task.status_id) || null : null,
    priority_config: task.priority_id ? priorityMap.get(task.priority_id) || null : null,
  }));
}

export function useTasks(filter: 'my' | 'created' | 'all' = 'my') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tasks', filter, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'my' && user?.id) {
        query = query.eq('assignee_id', user.id);
      } else if (filter === 'created' && user?.id) {
        query = query.eq('creator_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return enrichTasksWithProfiles(data) as Promise<Task[]>;
    },
    enabled: !!user,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const enriched = await enrichTasksWithProfiles([data]);
      return enriched[0] as Task;
    },
    enabled: !!taskId,
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      const authorIds = [...new Set(data.map(c => c.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', authorIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(comment => ({
        ...comment,
        author: profileMap.get(comment.author_id) || null,
      })) as TaskComment[];
    },
    enabled: !!taskId,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Partial<Task> & { assigneeIds?: string[] }) => {
      const { data, error } = await apiPost<Task>('/tasks', task);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating task', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await apiPost<Task>(`/tasks/${id}`, { ...updates, _method: 'PATCH' });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await apiPost(`/tasks/${taskId}`, { _method: 'DELETE' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast({ title: 'Task deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting task', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: string; body: string }) => {
      const { data, error } = await apiPost<TaskComment>(`/tasks/${taskId}/comments`, { body });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.taskId] });
      toast({ title: 'Comment added' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding comment', description: error.message, variant: 'destructive' });
    },
  });
}

// Multi-assignee hooks
export function useUpdateTaskAssignees() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      const { data, error } = await apiPost<{ added: string[]; removed: string[] }>(`/tasks/${taskId}/assignees`, { userIds });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.taskId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating assignees', description: error.message, variant: 'destructive' });
    },
  });
}
