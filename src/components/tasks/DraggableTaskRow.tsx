import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Task } from '@/types/tasks';
import { cn } from '@/lib/utils';

interface DraggableTaskRowProps {
  task: Task;
  columns: { id: string; width: string }[];
  renderCell: (columnId: string, task: Task) => React.ReactNode;
}

export function DraggableTaskRow({ task, columns, renderCell }: DraggableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: { type: 'task', task }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow 
      ref={setNodeRef}
      style={style}
      className={cn(
        "hover:bg-muted/50",
        isDragging && "opacity-50 bg-muted shadow-lg z-50"
      )}
    >
      <TableCell className="w-8 p-2">
        <div 
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      {columns.map((col) => (
        <TableCell key={col.id} className={cn(col.width, "text-left align-middle")}>
          {renderCell(col.id, task)}
        </TableCell>
      ))}
    </TableRow>
  );
}
