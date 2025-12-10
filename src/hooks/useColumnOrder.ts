import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ColumnDef {
  id: string;
  label: string;
  width: string;
}

const DEFAULT_TASK_COLUMNS: ColumnDef[] = [
  { id: 'status', label: 'Status', width: 'w-[120px]' },
  { id: 'task', label: 'Task', width: 'w-[180px]' },
  { id: 'priority', label: 'Priority', width: 'w-[120px]' },
  { id: 'assignees', label: 'Assignees', width: 'w-[100px]' },
  { id: 'area', label: 'Area', width: 'w-[80px]' },
  { id: 'due', label: 'Due', width: 'w-[70px]' },
  { id: 'added', label: 'Added', width: 'w-[70px]' },
];

export function useColumnOrder(viewKey: string = 'admin_tasks') {
  const { user } = useAuth();
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_TASK_COLUMNS);
  const [loading, setLoading] = useState(true);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load saved column order from user_preferences
  useEffect(() => {
    const loadColumnOrder = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_preferences')
          .select('preference_value')
          .eq('user_id', user.id)
          .eq('preference_key', `${viewKey}_column_order`)
          .maybeSingle();

        if (data?.preference_value) {
          const savedOrder = data.preference_value as string[];
          // Reorder columns based on saved order
          const reordered = savedOrder
            .map(id => DEFAULT_TASK_COLUMNS.find(col => col.id === id))
            .filter((col): col is ColumnDef => col !== undefined);
          
          // Add any new columns that weren't in the saved order
          const missing = DEFAULT_TASK_COLUMNS.filter(
            col => !savedOrder.includes(col.id)
          );
          
          setColumns([...reordered, ...missing]);
        }
      } catch (error) {
        console.error('Error loading column order:', error);
      } finally {
        setLoading(false);
      }
    };

    loadColumnOrder();
  }, [user, viewKey]);

  // Save column order to user_preferences
  const saveColumnOrder = useCallback(async (newColumns: ColumnDef[]) => {
    if (!user) return;

    const columnIds = newColumns.map(col => col.id);
    
    try {
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id')
        .eq('user_id', user.id)
        .eq('preference_key', `${viewKey}_column_order`)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_preferences')
          .update({ preference_value: columnIds })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({
            user_id: user.id,
            preference_key: `${viewKey}_column_order`,
            preference_value: columnIds,
          });
      }
    } catch (error) {
      console.error('Error saving column order:', error);
    }
  }, [user, viewKey]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...columns];
    const [draggedColumn] = newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedColumn);
    
    setColumns(newColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      saveColumnOrder(columns);
    }
    setDraggedIndex(null);
  };

  const resetToDefault = () => {
    setColumns(DEFAULT_TASK_COLUMNS);
    saveColumnOrder(DEFAULT_TASK_COLUMNS);
  };

  return {
    columns,
    loading,
    draggedIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    resetToDefault,
  };
}
