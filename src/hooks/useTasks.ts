import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task, TaskComment, TaskAssignee } from '@/types/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { apiPost, apiGet } from '@/lib/api';

export function useTasks(filter: 'my' | 'created' | 'all' = 'my') {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tasks', filter, user?.id],
    queryFn: async () => {
      const { data, error } = await apiGet<Task[]>(`/tasks`, { filter });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

export function useTask(taskId: string) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await apiGet<Task>(`/tasks/${taskId}`);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      const { data, error } = await apiGet<TaskComment[]>(`/tasks/${taskId}/comments`);
      if (error) throw error;
      return data || [];
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
