import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableSectionProps {
  id: string;
  children: React.ReactNode;
}

export function DroppableSection({ id, children }: DroppableSectionProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: { type: 'section', sectionId: id }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "transition-colors duration-200",
        isOver && "bg-primary/5 ring-2 ring-primary/20 rounded-lg"
      )}
    >
      {children}
    </div>
  );
}
