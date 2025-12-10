import { TaskPriority, PRIORITY_CONFIG } from '@/types/tasks';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  editable?: boolean;
  onChange?: (priority: TaskPriority) => void;
}

export function TaskPriorityBadge({ priority, editable = false, onChange }: TaskPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  if (editable && onChange) {
    return (
      <Select value={priority} onValueChange={(value) => onChange(value as TaskPriority)}>
        <SelectTrigger className="w-[100px] h-7 text-xs border-0 p-0">
          <Badge className={cn('cursor-pointer', config.color)}>
            {config.label}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PRIORITY_CONFIG).map(([key, value]) => (
            <SelectItem key={key} value={key}>
              <Badge className={value.color}>{value.label}</Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return <Badge className={config.color}>{config.label}</Badge>;
}
