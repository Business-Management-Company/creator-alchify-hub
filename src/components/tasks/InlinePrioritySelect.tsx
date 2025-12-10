import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTaskPriorities } from '@/hooks/useTaskConfigs';
import { useUpdateTask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface InlinePrioritySelectProps {
  taskId: string;
  currentPriorityId: string | null;
  currentPriorityName: string;
  currentPriorityColor: string;
}

export function InlinePrioritySelect({
  taskId,
  currentPriorityId,
  currentPriorityName,
  currentPriorityColor,
}: InlinePrioritySelectProps) {
  const [open, setOpen] = useState(false);
  const { data: priorities = [] } = useTaskPriorities();
  const updateTask = useUpdateTask();

  const handleSelect = async (priorityId: string) => {
    if (priorityId !== currentPriorityId) {
      await updateTask.mutateAsync({ id: taskId, priority_id: priorityId });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Badge
          variant="outline"
          className="text-xs cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap"
          style={{
            backgroundColor: `${currentPriorityColor}20`,
            borderColor: currentPriorityColor,
            color: currentPriorityColor,
          }}
        >
          {currentPriorityName}
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-popover border border-border shadow-lg z-50" align="start">
        <div className="flex flex-col gap-0.5">
          {priorities.map((priority) => (
            <button
              key={priority.id}
              onClick={() => handleSelect(priority.id)}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted text-left',
                priority.id === currentPriorityId && 'bg-muted'
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: priority.color || '#6b7280' }}
              />
              <span className="truncate">{priority.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
