import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Task, AREA_OPTIONS, ReleaseTarget } from '@/types/tasks';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useTaskStatuses, useTaskPriorities } from '@/hooks/useTaskConfigs';
import { Loader2 } from 'lucide-react';

interface TaskEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
}

const RELEASE_TARGETS: { value: ReleaseTarget; label: string }[] = [
  { value: 'Dec-15-Full-Test', label: 'Dec 15 Full Test' },
  { value: 'Jan-1-Alpha', label: 'Jan 1 Alpha' },
  { value: 'Backlog', label: 'Backlog' },
];

export function TaskEditDrawer({ open, onOpenChange, task }: TaskEditDrawerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [releaseTarget, setReleaseTarget] = useState<ReleaseTarget>('Backlog');
  const [dueDate, setDueDate] = useState('');
  const [area, setArea] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [linkedUrl, setLinkedUrl] = useState('');

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const isLoading = createTask.isPending || updateTask.isPending;

  const { data: statuses = [] } = useTaskStatuses();
  const { data: priorities = [] } = useTaskPriorities();

  // Fetch users for assignee selection
  const { data: users = [] } = useQuery({
    queryKey: ['profiles-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url')
        .order('display_name');
      if (error) throw error;
      return data;
    },
  });

  // Get defaults
  const defaultStatus = statuses.find(s => s.is_default);
  const defaultPriority = priorities.find(p => p.is_default);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatusId(task.status_id || '');
      setPriorityId(task.priority_id || '');
      setReleaseTarget(task.release_target || 'Backlog');
      setDueDate(task.due_date || '');
      setArea(task.area || '');
      setAssigneeId(task.assignee_id || '');
      setLinkedUrl(task.linked_url || '');
    } else {
      setTitle('');
      setDescription('');
      setStatusId(defaultStatus?.id || '');
      setPriorityId(defaultPriority?.id || '');
      setReleaseTarget('Backlog');
      setDueDate('');
      setArea('');
      setAssigneeId('');
      setLinkedUrl('');
    }
  }, [task, open, defaultStatus?.id, defaultPriority?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const taskData = {
      title,
      description: description || null,
      status_id: statusId || null,
      priority_id: priorityId || null,
      release_target: releaseTarget,
      due_date: dueDate || null,
      area: area || null,
      assignee_id: assigneeId || null,
      linked_url: linkedUrl || null,
    };

    if (task) {
      await updateTask.mutateAsync({ id: task.id, ...taskData });
    } else {
      await createTask.mutateAsync(taskData);
    }
    
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task ? 'Edit Task' : 'New Task'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusId || 'none'} onValueChange={(v) => setStatusId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priorityId || 'none'} onValueChange={(v) => setPriorityId(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {priorities.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Release Target</Label>
            <RadioGroup 
              value={releaseTarget} 
              onValueChange={(v) => setReleaseTarget(v as ReleaseTarget)}
              className="flex flex-wrap gap-3"
            >
              {RELEASE_TARGETS.map((rt) => (
                <div key={rt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={rt.value} id={`release-${rt.value}`} />
                  <label 
                    htmlFor={`release-${rt.value}`}
                    className="text-sm cursor-pointer"
                  >
                    {rt.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Assignee</Label>
            <Select value={assigneeId || 'unassigned'} onValueChange={(v) => setAssigneeId(v === 'unassigned' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select assignee..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {(user.display_name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.display_name || 'Unknown User'}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Area</Label>
              <Select value={area || 'none'} onValueChange={(v) => setArea(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select area..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {AREA_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="linked_url">Link (optional)</Label>
            <Input
              id="linked_url"
              type="url"
              value={linkedUrl}
              onChange={(e) => setLinkedUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {task ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
