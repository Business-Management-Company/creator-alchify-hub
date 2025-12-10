import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TaskStatusConfig, TaskPriorityConfig } from '@/types/tasks';
import { toast } from '@/hooks/use-toast';

// Task Statuses
export function useTaskStatuses() {
  return useQuery({
    queryKey: ['task-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_statuses')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as TaskStatusConfig[];
    },
  });
}

export function useCreateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (status: { name: string; slug: string; sort_order: number; color?: string; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from('task_statuses')
        .insert(status)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      toast({ title: 'Status created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskStatusConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('task_statuses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_statuses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      toast({ title: 'Status deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting status', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderTaskStatuses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase.from('task_statuses').update({ sort_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error reordering', description: error.message, variant: 'destructive' });
    },
  });
}

// Task Priorities
export function useTaskPriorities() {
  return useQuery({
    queryKey: ['task-priorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_priorities')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as TaskPriorityConfig[];
    },
  });
}

export function useCreateTaskPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (priority: { name: string; code: string; sort_order: number; color?: string; is_default?: boolean }) => {
      const { data, error } = await supabase
        .from('task_priorities')
        .insert(priority)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
      toast({ title: 'Priority created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating priority', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateTaskPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskPriorityConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('task_priorities')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating priority', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteTaskPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('task_priorities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
      toast({ title: 'Priority deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting priority', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderTaskPriorities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => 
        supabase.from('task_priorities').update({ sort_order: index + 1 }).eq('id', id)
      );
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error reordering', description: error.message, variant: 'destructive' });
    },
  });
}

// Set default helpers
export function useSetDefaultStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase.from('task_statuses').update({ is_default: false }).neq('id', '');
      // Then set the new default
      const { error } = await supabase.from('task_statuses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-statuses'] });
      toast({ title: 'Default status updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error setting default', description: error.message, variant: 'destructive' });
    },
  });
}

export function useSetDefaultPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase.from('task_priorities').update({ is_default: false }).neq('id', '');
      // Then set the new default
      const { error } = await supabase.from('task_priorities').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-priorities'] });
      toast({ title: 'Default priority updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error setting default', description: error.message, variant: 'destructive' });
    },
  });
}
