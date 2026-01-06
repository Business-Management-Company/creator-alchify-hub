import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

export interface TaskSection {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export function useTaskSections() {
  return useQuery({
    queryKey: ['task-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_sections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TaskSection[];
    },
  });
}

export function useCreateTaskSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const { data, error } = await apiPost<TaskSection>('/task-sections', { name, color });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections'] });
      toast.success('Section created');
    },
    onError: () => {
      toast.error('Failed to create section');
    },
  });
}

export function useUpdateTaskSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskSection> & { id: string }) => {
      const { data, error } = await apiPost<TaskSection>(`/task-sections/${id}`, { ...updates, _method: 'PATCH' });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections'] });
    },
    onError: () => {
      toast.error('Failed to update section');
    },
  });
}

export function useDeleteTaskSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiPost(`/task-sections/${id}`, { _method: 'DELETE' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Section deleted');
    },
    onError: () => {
      toast.error('Failed to delete section');
    },
  });
}

export function useReorderTaskSections() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const { error } = await apiPost('/task-sections/reorder', { orderedIds });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-sections'] });
    },
  });
}

export function useAssignTaskToSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, sectionId }: { taskId: string; sectionId: string | null }) => {
      const { error } = await apiPost(`/tasks/${taskId}/section`, { sectionId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
