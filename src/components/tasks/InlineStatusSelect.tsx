import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useTaskStatuses } from '@/hooks/useTaskConfigs';
import { useUpdateTask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

interface InlineStatusSelectProps {
  taskId: string;
  currentStatusId: string | null;
  currentStatusName: string;
  currentStatusColor: string;
}

export function InlineStatusSelect({
  taskId,
  currentStatusId,
  currentStatusName,
  currentStatusColor,
}: InlineStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const { data: statuses = [] } = useTaskStatuses();
  const updateTask = useUpdateTask();

  const handleSelect = async (statusId: string) => {
    if (statusId !== currentStatusId) {
      await updateTask.mutateAsync({ id: taskId, status_id: statusId });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setOpen(true);
          }}
          className="inline-flex"
        >
          <Badge
            variant="outline"
            className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
            style={{
              backgroundColor: `${currentStatusColor}20`,
              borderColor: currentStatusColor,
              color: currentStatusColor,
            }}
          >
            {currentStatusName}
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1 bg-popover border border-border shadow-lg z-[100]" align="start">
        <div className="flex flex-col gap-0.5">
          {statuses.map((status) => (
            <button
              key={status.id}
              onClick={() => handleSelect(status.id)}
              className={cn(
                'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted text-left',
                status.id === currentStatusId && 'bg-muted'
              )}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: status.color || '#6b7280' }}
              />
              <span className="truncate">{status.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
