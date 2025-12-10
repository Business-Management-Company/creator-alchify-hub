import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      // Get max sort_order
      const { data: existing } = await supabase
        .from('task_sections')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

      const { data, error } = await supabase
        .from('task_sections')
        .insert({ name, color: color || '#6366f1', sort_order: nextOrder })
        .select()
        .single();

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
      const { data, error } = await supabase
        .from('task_sections')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

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
      const { error } = await supabase
        .from('task_sections')
        .delete()
        .eq('id', id);

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
      const updates = orderedIds.map((id, index) => 
        supabase.from('task_sections').update({ sort_order: index }).eq('id', id)
      );
      await Promise.all(updates);
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
      const { error } = await supabase
        .from('tasks')
        .update({ section_id: sectionId })
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
