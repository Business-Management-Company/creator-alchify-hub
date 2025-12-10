import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Task, TaskComment, TaskAssignee } from '@/types/tasks';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title!,
          description: task.description,
          status: task.status || 'backlog',
          priority: task.priority || 'medium',
          status_id: task.status_id,
          priority_id: task.priority_id,
          release_target: task.release_target || 'Backlog',
          due_date: task.due_date,
          area: task.area,
          creator_id: user!.id,
          assignee_id: task.assignee_id,
          linked_url: task.linked_url,
        })
        .select()
        .single();
      if (error) throw error;

      // Create notification for assignee if different from creator
      if (task.assignee_id && task.assignee_id !== user!.id) {
        await supabase.from('notifications').insert({
          user_id: task.assignee_id,
          task_id: data.id,
          type: 'task_assigned',
          title: 'New Task Assigned',
          message: `You've been assigned a new task: ${task.title}`,
        });
      }

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      // Get original task for notification logic
      const { data: originalTask } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Notify relevant users about update
      if (originalTask) {
        const usersToNotify = new Set<string>();
        if (originalTask.creator_id !== user!.id) usersToNotify.add(originalTask.creator_id);
        if (originalTask.assignee_id && originalTask.assignee_id !== user!.id) usersToNotify.add(originalTask.assignee_id);

        for (const userId of usersToNotify) {
          await supabase.from('notifications').insert({
            user_id: userId,
            task_id: id,
            type: 'task_updated',
            title: 'Task Updated',
            message: `A task was updated: ${originalTask.title}`,
          });
        }
      }

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
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: string; body: string }) => {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_id: user!.id,
          body,
        })
        .select()
        .single();
      if (error) throw error;

      // Notify task participants
      const { data: task } = await supabase
        .from('tasks')
        .select('title, creator_id, assignee_id')
        .eq('id', taskId)
        .single();

      if (task) {
        const usersToNotify = new Set<string>();
        if (task.creator_id !== user!.id) usersToNotify.add(task.creator_id);
        if (task.assignee_id && task.assignee_id !== user!.id) usersToNotify.add(task.assignee_id);

        for (const userId of usersToNotify) {
          await supabase.from('notifications').insert({
            user_id: userId,
            task_id: taskId,
            type: 'task_commented',
            title: 'New Comment on Task',
            message: `Someone commented on: ${task.title}`,
          });
        }
      }

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
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ taskId, userIds }: { taskId: string; userIds: string[] }) => {
      // Get current assignees
      const { data: currentAssignees } = await supabase
        .from('task_assignees')
        .select('user_id')
        .eq('task_id', taskId);
      
      const currentIds = new Set((currentAssignees || []).map(a => a.user_id));
      const newIds = new Set(userIds);
      
      // Find additions and removals
      const toAdd = userIds.filter(id => !currentIds.has(id));
      const toRemove = [...currentIds].filter(id => !newIds.has(id));
      
      // Remove old assignees
      if (toRemove.length) {
        await supabase
          .from('task_assignees')
          .delete()
          .eq('task_id', taskId)
          .in('user_id', toRemove);
      }
      
      // Add new assignees
      if (toAdd.length) {
        await supabase
          .from('task_assignees')
          .insert(toAdd.map(user_id => ({ task_id: taskId, user_id })));
        
        // Notify new assignees
        const { data: task } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', taskId)
          .single();
        
        if (task) {
          for (const userId of toAdd) {
            if (userId !== user!.id) {
              await supabase.from('notifications').insert({
                user_id: userId,
                task_id: taskId,
                type: 'task_assigned',
                title: 'Task Assigned',
                message: `You've been assigned to: ${task.title}`,
              });
            }
          }
        }
      }
      
      // Also update legacy assignee_id to first assignee
      await supabase
        .from('tasks')
        .update({ assignee_id: userIds[0] || null })
        .eq('id', taskId);
      
      return { added: toAdd, removed: toRemove };
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
