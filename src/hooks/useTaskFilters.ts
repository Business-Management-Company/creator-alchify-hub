import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface TaskFilterConfig {
  id: string;
  label: string;
  slug: string;
  field: string;
  type: 'enum' | 'date' | 'number' | 'boolean';
  operator: 'equals' | 'not_equals' | 'in' | 'between' | 'gte' | 'lte' | 'contains';
  options: string[];
  visible_by_default: boolean;
  display_order: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useTaskFilterConfigs() {
  return useQuery({
    queryKey: ['task-filter-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_filter_configs')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TaskFilterConfig[];
    },
  });
}

export function useVisibleTaskFilters() {
  return useQuery({
    queryKey: ['task-filter-configs', 'visible'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_filter_configs')
        .select('*')
        .eq('visible_by_default', true)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TaskFilterConfig[];
    },
  });
}

export function useCreateFilterConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Omit<TaskFilterConfig, 'id' | 'is_default' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('task_filter_configs')
        .insert({
          ...config,
          is_default: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-filter-configs'] });
      toast({ title: 'Filter created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating filter', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateFilterConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TaskFilterConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from('task_filter_configs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-filter-configs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating filter', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteFilterConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_filter_configs')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-filter-configs'] });
      toast({ title: 'Filter deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting filter', description: error.message, variant: 'destructive' });
    },
  });
}

export function useReorderFilters() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const updates = orderedIds.map((id, index) => ({
        id,
        display_order: index + 1,
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from('task_filter_configs')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-filter-configs'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error reordering filters', description: error.message, variant: 'destructive' });
    },
  });
}
