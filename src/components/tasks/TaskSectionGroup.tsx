import { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TaskSection, useUpdateTaskSection, useDeleteTaskSection } from '@/hooks/useTaskSections';
import { cn } from '@/lib/utils';

interface TaskSectionGroupProps {
  section: TaskSection;
  taskCount: number;
  children: React.ReactNode;
  onAddTask?: (sectionId: string) => void;
}

export function TaskSectionGroup({ section, taskCount, children, onAddTask }: TaskSectionGroupProps) {
  const [isOpen, setIsOpen] = useState(!section.is_collapsed);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(section.name);
  
  const updateSection = useUpdateTaskSection();
  const deleteSection = useDeleteTaskSection();

  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    updateSection.mutate({ id: section.id, is_collapsed: !open });
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== section.name) {
      updateSection.mutate({ id: section.id, name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setEditName(section.name);
      setIsEditing(false);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={handleToggle}>
      <div className="border rounded-lg mb-3 overflow-hidden">
        {/* Section Header */}
        <div 
          className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b"
          style={{ borderLeftColor: section.color, borderLeftWidth: '4px' }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              className="h-7 w-48 text-sm font-medium"
              autoFocus
            />
          ) : (
            <span 
              className="font-medium text-sm cursor-pointer hover:text-primary"
              onClick={() => setIsEditing(true)}
            >
              {section.name}
            </span>
          )}

          <span className="text-xs text-muted-foreground ml-1">
            ({taskCount})
          </span>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => onAddTask?.(section.id)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Task
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => deleteSection.mutate(section.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Section
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Section Content */}
        <CollapsibleContent>
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
