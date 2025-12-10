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
import {
  useTaskSections,
  useCreateTaskSection,
  useUpdateTaskSection,
  useDeleteTaskSection,
  useReorderTaskSections,
  TaskSection,
} from '@/hooks/useTaskSections';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { TaskStatusConfig, TaskPriorityConfig } from '@/types/tasks';

const TAB_OPTIONS = [
  { value: 'all', label: 'All Tasks' },
  { value: 'my', label: 'My Tasks' },
  { value: 'created', label: 'Created by Me' },
] as const;

export default function AdminTaskSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  
  const { data: statuses = [], isLoading: statusesLoading } = useTaskStatuses();
  const { data: priorities = [], isLoading: prioritiesLoading } = useTaskPriorities();
  const { data: sections = [], isLoading: sectionsLoading } = useTaskSections();
  
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

  const createSection = useCreateTaskSection();
  const updateSection = useUpdateTaskSection();
  const deleteSection = useDeleteTaskSection();
  const reorderSections = useReorderTaskSections();
  
  const [statusDialog, setStatusDialog] = useState(false);
  const [priorityDialog, setPriorityDialog] = useState(false);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<TaskStatusConfig | null>(null);
  const [editingPriority, setEditingPriority] = useState<TaskPriorityConfig | null>(null);
  const [editingSection, setEditingSection] = useState<TaskSection | null>(null);
  
  const [statusName, setStatusName] = useState('');
  const [statusSlug, setStatusSlug] = useState('');
  const [statusColor, setStatusColor] = useState('#6b7280');
  const [priorityName, setPriorityName] = useState('');
  const [priorityCode, setPriorityCode] = useState('');
  const [priorityColor, setPriorityColor] = useState('#6b7280');
  const [sectionName, setSectionName] = useState('');
  const [sectionColor, setSectionColor] = useState('#6366f1');
  
  // Default tab preference
  const [defaultTab, setDefaultTabState] = useState<string>(() => {
    return localStorage.getItem('admin_tasks_default_tab') || 'all';
  });
  
  const handleDefaultTabChange = (value: string) => {
    setDefaultTabState(value);
    localStorage.setItem('admin_tasks_default_tab', value);
  };
  
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
      setStatusColor(status.color || '#6b7280');
    } else {
      setEditingStatus(null);
      setStatusName('');
      setStatusSlug('');
      setStatusColor('#6b7280');
    }
    setStatusDialog(true);
  };

  const handleOpenPriorityDialog = (priority?: TaskPriorityConfig) => {
    if (priority) {
      setEditingPriority(priority);
      setPriorityName(priority.name);
      setPriorityCode(priority.code);
      setPriorityColor(priority.color || '#6b7280');
    } else {
      setEditingPriority(null);
      setPriorityName('');
      setPriorityCode('');
      setPriorityColor('#6b7280');
    }
    setPriorityDialog(true);
  };

  const handleOpenSectionDialog = (section?: TaskSection) => {
    if (section) {
      setEditingSection(section);
      setSectionName(section.name);
      setSectionColor(section.color || '#6366f1');
    } else {
      setEditingSection(null);
      setSectionName('');
      setSectionColor('#6366f1');
    }
    setSectionDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!statusName.trim() || !statusSlug.trim()) return;
    
    if (editingStatus) {
      await updateStatus.mutateAsync({ id: editingStatus.id, name: statusName, slug: statusSlug, color: statusColor });
    } else {
      await createStatus.mutateAsync({ 
        name: statusName, 
        slug: statusSlug, 
        color: statusColor,
        sort_order: statuses.length + 1 
      });
    }
    setStatusDialog(false);
  };

  const handleSavePriority = async () => {
    if (!priorityName.trim() || !priorityCode.trim()) return;
    
    if (editingPriority) {
      await updatePriority.mutateAsync({ id: editingPriority.id, name: priorityName, code: priorityCode, color: priorityColor });
    } else {
      await createPriority.mutateAsync({ 
        name: priorityName, 
        code: priorityCode, 
        color: priorityColor,
        sort_order: priorities.length + 1 
      });
    }
    setPriorityDialog(false);
  };

  const handleSaveSection = async () => {
    if (!sectionName.trim()) return;
    
    if (editingSection) {
      await updateSection.mutateAsync({ id: editingSection.id, name: sectionName, color: sectionColor });
    } else {
      await createSection.mutateAsync({ name: sectionName, color: sectionColor });
    }
    setSectionDialog(false);
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

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    reorderSections.mutate(newOrder.map(s => s.id));
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
              Configure task sections, statuses, and priorities.
            </p>
          </div>

          {/* Sections */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Sections / Groups</CardTitle>
              <Button size="sm" variant="outline" onClick={() => handleOpenSectionDialog()}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {sectionsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sections.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No sections created yet. Add a section to organize your tasks.
                </p>
              ) : (
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <div 
                      key={section.id} 
                      className="flex items-center justify-between p-2 rounded border bg-muted/20 hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button 
                            onClick={() => handleMoveSection(index, 'up')}
                            disabled={index === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <GripVertical className="h-3 w-3" />
                          </button>
                        </div>
                        <div 
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: section.color || '#6366f1' }}
                        />
                        <span 
                          className="text-sm text-foreground cursor-pointer"
                          onClick={() => handleOpenSectionDialog(section)}
                        >
                          {section.name}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => deleteSection.mutate(section.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                Sections help you group tasks (e.g., To Do, In Progress, Done).
              </p>
            </CardContent>
          </Card>

          {/* Default Tab Preference */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Default Tab</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={defaultTab} onValueChange={handleDefaultTabChange}>
                <div className="flex flex-wrap gap-4">
                  {TAB_OPTIONS.map((option) => (
                    <div key={option.value} className="flex items-center gap-2">
                      <RadioGroupItem value={option.value} id={`tab-${option.value}`} />
                      <label htmlFor={`tab-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              <p className="text-xs text-muted-foreground mt-3">
                This tab will be selected by default when you open the Tasks page.
              </p>
            </CardContent>
          </Card>

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
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: status.color || '#6b7280' }}
                          />
                          <RadioGroupItem value={status.id} id={`status-${status.id}`} />
                          <label 
                            htmlFor={`status-${status.id}`}
                            className="text-sm text-foreground cursor-pointer"
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
                          <div 
                            className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: priority.color || '#6b7280' }}
                          />
                          <RadioGroupItem value={priority.id} id={`priority-${priority.id}`} />
                          <label 
                            htmlFor={`priority-${priority.id}`}
                            className="text-sm text-foreground cursor-pointer"
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
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingStatus ? 'Edit Status' : 'Add Status'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input 
                  value={statusName} 
                  onChange={(e) => setStatusName(e.target.value)}
                  placeholder="e.g. In Review"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Slug</Label>
                <Input 
                  value={statusSlug} 
                  onChange={(e) => setStatusSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g. in-review"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={statusColor}
                    onChange={(e) => setStatusColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input 
                    value={statusColor} 
                    onChange={(e) => setStatusColor(e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1"
                  />
                </div>
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
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingPriority ? 'Edit Priority' : 'Add Priority'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input 
                  value={priorityName} 
                  onChange={(e) => setPriorityName(e.target.value)}
                  placeholder="e.g. P1 – High"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Code</Label>
                <Input 
                  value={priorityCode} 
                  onChange={(e) => setPriorityCode(e.target.value.toUpperCase())}
                  placeholder="e.g. P1"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={priorityColor}
                    onChange={(e) => setPriorityColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input 
                    value={priorityColor} 
                    onChange={(e) => setPriorityColor(e.target.value)}
                    placeholder="#6b7280"
                    className="flex-1"
                  />
                </div>
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

        {/* Section Dialog */}
        <Dialog open={sectionDialog} onOpenChange={setSectionDialog}>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-foreground">Name</Label>
                <Input 
                  value={sectionName} 
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="e.g. To Do, In Progress, Done"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={sectionColor}
                    onChange={(e) => setSectionColor(e.target.value)}
                    className="w-10 h-10 rounded border cursor-pointer"
                  />
                  <Input 
                    value={sectionColor} 
                    onChange={(e) => setSectionColor(e.target.value)}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSectionDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveSection} disabled={!sectionName.trim()}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
