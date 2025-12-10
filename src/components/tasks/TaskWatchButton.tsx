import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTaskWatchers } from '@/hooks/useTaskWatchers';
import { cn } from '@/lib/utils';

interface TaskWatchButtonProps {
  taskId: string;
  compact?: boolean;
}

export function TaskWatchButton({ taskId, compact = true }: TaskWatchButtonProps) {
  const { isWatching, toggleWatch, isToggling } = useTaskWatchers(taskId);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 flex-shrink-0",
            isWatching ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleWatch();
          }}
          disabled={isToggling}
        >
          {isWatching ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {isWatching 
          ? "You're watching this task. Click to unwatch." 
          : "Watch this task to get notified of changes."}
      </TooltipContent>
    </Tooltip>
  );
}
