import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { apiPost } from '@/lib/api';

export function useTaskWatchers(taskId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: watchers = [], isLoading } = useQuery({
    queryKey: ['task-watchers', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_watchers')
        .select('id, user_id, created_at')
        .eq('task_id', taskId);
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  const isWatching = watchers.some(w => w.user_id === user?.id);

  const toggleWatch = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await apiPost(`/tasks/${taskId}/watch`, { action: isWatching ? 'unwatch' : 'watch' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-watchers', taskId] });
    },
  });

  return {
    watchers,
    isWatching,
    isLoading,
    toggleWatch: toggleWatch.mutate,
    isToggling: toggleWatch.isPending,
  };
}
