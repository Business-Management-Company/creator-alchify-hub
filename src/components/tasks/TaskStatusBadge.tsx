import { TaskStatus, STATUS_CONFIG } from '@/types/tasks';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TaskStatusBadgeProps {
  status: TaskStatus;
  editable?: boolean;
  onChange?: (status: TaskStatus) => void;
}

export function TaskStatusBadge({ status, editable = false, onChange }: TaskStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  if (editable && onChange) {
    return (
      <Select value={status} onValueChange={(value) => onChange(value as TaskStatus)}>
        <SelectTrigger className="w-[130px] h-7 text-xs border-0 p-0">
          <Badge className={cn('cursor-pointer', config.color)}>
            {config.label}
          </Badge>
        </SelectTrigger>
        <SelectContent>
          {Object.entries(STATUS_CONFIG).map(([key, value]) => (
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
