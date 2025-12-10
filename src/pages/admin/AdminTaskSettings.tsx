import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Plus, Trash2, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useTaskStatuses,
  useTaskPriorities,
  useCreateTaskStatus,
  useUpdateTaskStatus,
  useDeleteTaskStatus,
  useCreateTaskPriority,
  useUpdateTaskPriority,
  useDeleteTaskPriority,
  useSetDefaultStatus,
  useSetDefaultPriority,
  useReorderTaskStatuses,
  useReorderTaskPriorities,
} from '@/hooks/useTaskConfigs';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TaskStatusConfig, TaskPriorityConfig } from '@/types/tasks';

export default function AdminTaskSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  const { data: statuses = [], isLoading: statusesLoading } = useTaskStatuses();
  const { data: priorities = [], isLoading: prioritiesLoading } = useTaskPriorities();
  
  const createStatus = useCreateTaskStatus();
  const updateStatus = useUpdateTaskStatus();
  const deleteStatus = useDeleteTaskStatus();
  const setDefaultStatus = useSetDefaultStatus();
  const reorderStatuses = useReorderTaskStatuses();
  
  const createPriority = useCreateTaskPriority();
  const updatePriority = useUpdateTaskPriority();
  const deletePriority = useDeleteTaskPriority();
  const setDefaultPriority = useSetDefaultPriority();
  const reorderPriorities = useReorderTaskPriorities();
  
  const [statusDialog, setStatusDialog] = useState(false);
  const [priorityDialog, setPriorityDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatusConfig | null>(null);
  const [editingPriority, setEditingPriority] = useState<TaskPriorityConfig | null>(null);
  
  const [statusName, setStatusName] = useState('');
  const [statusSlug, setStatusSlug] = useState('');
  const [priorityName, setPriorityName] = useState('');
  const [priorityCode, setPriorityCode] = useState('');
  
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleOpenStatusDialog = (status?: TaskStatusConfig) => {
    if (status) {
      setEditingStatus(status);
      setStatusName(status.name);
      setStatusSlug(status.slug);
    } else {
      setEditingStatus(null);
      setStatusName('');
      setStatusSlug('');
    }
    setStatusDialog(true);
  };

  const handleOpenPriorityDialog = (priority?: TaskPriorityConfig) => {
    if (priority) {
      setEditingPriority(priority);
      setPriorityName(priority.name);
      setPriorityCode(priority.code);
    } else {
      setEditingPriority(null);
      setPriorityName('');
      setPriorityCode('');
    }
    setPriorityDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!statusName.trim() || !statusSlug.trim()) return;
    
    if (editingStatus) {
      await updateStatus.mutateAsync({ id: editingStatus.id, name: statusName, slug: statusSlug });
    } else {
      await createStatus.mutateAsync({ 
        name: statusName, 
        slug: statusSlug, 
        sort_order: statuses.length + 1 
      });
    }
    setStatusDialog(false);
  };

  const handleSavePriority = async () => {
    if (!priorityName.trim() || !priorityCode.trim()) return;
    
    if (editingPriority) {
      await updatePriority.mutateAsync({ id: editingPriority.id, name: priorityName, code: priorityCode });
    } else {
      await createPriority.mutateAsync({ 
        name: priorityName, 
        code: priorityCode, 
        sort_order: priorities.length + 1 
      });
    }
    setPriorityDialog(false);
  };

  const handleMoveStatus = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...statuses];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    reorderStatuses.mutate(newOrder.map(s => s.id));
  };

  const handleMovePriority = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...priorities];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    reorderPriorities.mutate(newOrder.map(p => p.id));
  };

  return (
    <>
      <Helmet>
        <title>Task Settings | Admin | Alchify</title>
      </Helmet>
      
      <AppLayout>
        <div className="space-y-6 max-w-4xl">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/tasks')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>

          <div>
            <h1 className="text-2xl font-semibold text-foreground">Task Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Configure task statuses and priorities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Statuses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Statuses</CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleOpenStatusDialog()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {statusesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <RadioGroup 
                    value={statuses.find(s => s.is_default)?.id || ''} 
                    onValueChange={(id) => setDefaultStatus.mutate(id)}
                  >
                    {statuses.map((status, index) => (
                      <div 
                        key={status.id} 
                        className="flex items-center justify-between p-2 rounded border bg-muted/20 hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button 
                              onClick={() => handleMoveStatus(index, 'up')}
                              disabled={index === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <GripVertical className="h-3 w-3" />
                            </button>
                          </div>
                          <RadioGroupItem value={status.id} id={`status-${status.id}`} />
                          <label 
                            htmlFor={`status-${status.id}`}
                            className="text-sm cursor-pointer"
                            onClick={() => handleOpenStatusDialog(status)}
                          >
                            {status.name}
                            <span className="text-xs text-muted-foreground ml-2">({status.slug})</span>
                          </label>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => deleteStatus.mutate(status.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                <p className="text-xs text-muted-foreground pt-2">
                  Selected = default status for new tasks
                </p>
              </CardContent>
            </Card>

            {/* Priorities */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Priorities</CardTitle>
                <Button size="sm" variant="outline" onClick={() => handleOpenPriorityDialog()}>
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {prioritiesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <RadioGroup 
                    value={priorities.find(p => p.is_default)?.id || ''} 
                    onValueChange={(id) => setDefaultPriority.mutate(id)}
                  >
                    {priorities.map((priority, index) => (
                      <div 
                        key={priority.id} 
                        className="flex items-center justify-between p-2 rounded border bg-muted/20 hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col gap-0.5">
                            <button 
                              onClick={() => handleMovePriority(index, 'up')}
                              disabled={index === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <GripVertical className="h-3 w-3" />
                            </button>
                          </div>
                          <RadioGroupItem value={priority.id} id={`priority-${priority.id}`} />
                          <label 
                            htmlFor={`priority-${priority.id}`}
                            className="text-sm cursor-pointer"
                            onClick={() => handleOpenPriorityDialog(priority)}
                          >
                            {priority.name}
                            <span className="text-xs text-muted-foreground ml-2">({priority.code})</span>
                          </label>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => deletePriority.mutate(priority.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                <p className="text-xs text-muted-foreground pt-2">
                  Selected = default priority for new tasks
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Status Dialog */}
        <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingStatus ? 'Edit Status' : 'Add Status'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={statusName} 
                  onChange={(e) => setStatusName(e.target.value)}
                  placeholder="e.g. In Review"
                />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input 
                  value={statusSlug} 
                  onChange={(e) => setStatusSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. in-review"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveStatus} disabled={!statusName.trim() || !statusSlug.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Priority Dialog */}
        <Dialog open={priorityDialog} onOpenChange={setPriorityDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingPriority ? 'Edit Priority' : 'Add Priority'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  value={priorityName} 
                  onChange={(e) => setPriorityName(e.target.value)}
                  placeholder="e.g. P1 – High"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input 
                  value={priorityCode} 
                  onChange={(e) => setPriorityCode(e.target.value.toUpperCase())}
                  placeholder="e.g. P1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPriorityDialog(false)}>Cancel</Button>
              <Button onClick={handleSavePriority} disabled={!priorityName.trim() || !priorityCode.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
