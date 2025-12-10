import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Plus, Filter, ExternalLink, Loader2, Settings, GripVertical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer';
import { AssigneesCell } from '@/components/tasks/MultiAssigneeSelect';
import { TaskSectionGroup } from '@/components/tasks/TaskSectionGroup';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { useTaskStatuses, useTaskPriorities } from '@/hooks/useTaskConfigs';
import { useTaskSections, useCreateTaskSection, useAssignTaskToSection } from '@/hooks/useTaskSections';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useColumnOrder } from '@/hooks/useColumnOrder';
import { Task, AREA_OPTIONS, ReleaseTarget } from '@/types/tasks';
import { format, isPast, isThisWeek, isToday } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

// Get saved default tab from localStorage
const getDefaultTab = (): 'my' | 'created' | 'all' => {
  const saved = localStorage.getItem('admin_tasks_default_tab');
  if (saved === 'my' || saved === 'created' || saved === 'all') {
    return saved;
  }
  return 'all';
};

export default function AdminTasks() {
  const [activeTab, setActiveTab] = useState<'my' | 'created' | 'all'>(getDefaultTab);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [releaseFilter, setReleaseFilter] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: tasks = [], isLoading } = useTasks(activeTab);
  const { data: statuses = [] } = useTaskStatuses();
  const { data: priorities = [] } = useTaskPriorities();
  const { data: sections = [], isLoading: sectionsLoading } = useTaskSections();
  const createSection = useCreateTaskSection();
  const assignToSection = useAssignTaskToSection();
  const updateTask = useUpdateTask();
  const {
    columns,
    draggedIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    resetToDefault,
  } = useColumnOrder('admin_tasks');
  
  const [newSectionName, setNewSectionName] = useState('');
  const [showNewSectionInput, setShowNewSectionInput] = useState(false);
  const [newTaskSectionId, setNewTaskSectionId] = useState<string | null>(null);

  // Fetch users for assignee filter
  const { data: users = [] } = useQuery({
    queryKey: ['profiles-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url')
        .order('display_name');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate, toast]);

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status_id !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority_id !== priorityFilter) return false;
    if (releaseFilter !== 'all' && task.release_target !== releaseFilter) return false;
    
    // Assignee filter - check if any assignee matches
    if (assigneeFilter !== 'all') {
      const hasMatchingAssignee = task.assignees?.some(a => a.user_id === assigneeFilter);
      if (!hasMatchingAssignee) return false;
    }
    
    if (dueFilter !== 'all') {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      if (dueFilter === 'overdue' && (!dueDate || !isPast(dueDate) || task.status_config?.slug === 'completed')) return false;
      if (dueFilter === 'today' && (!dueDate || !isToday(dueDate))) return false;
      if (dueFilter === 'this_week' && (!dueDate || !isThisWeek(dueDate))) return false;
      if (dueFilter === 'no_date' && dueDate) return false;
    }
    
    return true;
  });

  const handleNewTask = (sectionId?: string) => {
    setNewTaskSectionId(sectionId || null);
    setEditingTask(null);
    setDrawerOpen(true);
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      createSection.mutate({ name: newSectionName.trim() });
      setNewSectionName('');
      setShowNewSectionInput(false);
    }
  };

  // Group tasks by section
  const tasksBySection = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    const unsectioned: Task[] = [];
    
    filteredTasks.forEach(task => {
      if (task.section_id) {
        if (!grouped[task.section_id]) grouped[task.section_id] = [];
        grouped[task.section_id].push(task);
      } else {
        unsectioned.push(task);
      }
    });
    
    return { grouped, unsectioned };
  }, [filteredTasks]);

  const getEmptyState = () => {
    switch (activeTab) {
      case 'my': return "You don't have any tasks yet.";
      case 'created': return "You haven't created any tasks yet.";
      default: return "No tasks found.";
    }
  };

  const getReleaseTargetColor = (target: ReleaseTarget | null) => {
    switch (target) {
      case 'Dec-15-Full-Test': return 'bg-destructive/20 text-destructive';
      case 'Jan-1-Alpha': return 'bg-blue-500/20 text-blue-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Render cell content based on column ID
  const renderCell = (columnId: string, task: Task) => {
    switch (columnId) {
      case 'status':
        return (
          <Badge variant="outline" className="text-xs">
            {task.status_config?.name || 'No Status'}
          </Badge>
        );
      case 'task':
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link 
                to={`/admin/tasks/${task.id}`}
                className="font-medium hover:underline flex items-center gap-1"
              >
                <span className="truncate block max-w-[150px]">{task.title}</span>
                {task.linked_url && (
                  <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              {task.title}
            </TooltipContent>
          </Tooltip>
        );
      case 'priority':
        return (
          <Badge variant="outline" className="text-xs whitespace-nowrap">
            {task.priority_config?.name || 'N/A'}
          </Badge>
        );
      case 'assignees':
        return <AssigneesCell assignees={task.assignees || []} />;
      case 'area':
        return task.area ? (
          <span className="text-xs text-muted-foreground">{task.area}</span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case 'due':
        return task.due_date ? (
          <span className={`text-xs ${isPast(new Date(task.due_date)) && task.status_config?.slug !== 'completed' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
            {format(new Date(task.due_date), 'MMM d')}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        );
      case 'added':
        return (
          <span className="text-xs text-muted-foreground">
            {format(new Date(task.created_at), 'MMM d')}
          </span>
        );
      default:
        return null;
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Tasks | Admin | Alchify</title>
      </Helmet>
      
      <AppLayout>
        <div className="space-y-4">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Admin Dashboard
          </Button>

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tasks</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track team tasks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/tasks/settings')}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button onClick={() => handleNewTask()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>

          {/* Tabs + Filters */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'created' | 'all')}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <TabsList className="h-9">
                <TabsTrigger value="my" className="text-sm">My Tasks</TabsTrigger>
                <TabsTrigger value="created" className="text-sm">Created by Me</TabsTrigger>
                {isAdmin && <TabsTrigger value="all" className="text-sm">All Tasks</TabsTrigger>}
              </TabsList>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    {priorities.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={releaseFilter} onValueChange={setReleaseFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Release" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Releases</SelectItem>
                    <SelectItem value="Dec-15-Full-Test">Dec 15 Full Test</SelectItem>
                    <SelectItem value="Jan-1-Alpha">Jan 1 Alpha</SelectItem>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dueFilter} onValueChange={setDueFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Due" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Due Dates</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="today">Due Today</SelectItem>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="no_date">No Due Date</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.user_id} value={u.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="text-[8px]">
                              {(u.display_name || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[80px]">{u.display_name || 'User'}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <TabsContent value={activeTab} className="mt-3 space-y-4">
              {isLoading || sectionsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTasks.length === 0 && sections.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/20">
                  <p className="text-muted-foreground mb-4">{getEmptyState()}</p>
                  <Button onClick={() => handleNewTask()} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                  </Button>
                </div>
              ) : (
                <TooltipProvider>
                  {/* Sections with tasks */}
                  {sections.map((section) => {
                    const sectionTasks = tasksBySection.grouped[section.id] || [];
                    return (
                      <TaskSectionGroup
                        key={section.id}
                        section={section}
                        taskCount={sectionTasks.length}
                        onAddTask={handleNewTask}
                      >
                        {sectionTasks.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground text-sm">
                            No tasks in this section
                          </div>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {columns.map((col, index) => (
                                  <TableHead
                                    key={col.id}
                                    className={cn(
                                      col.width,
                                      'cursor-grab select-none',
                                      draggedIndex === index && 'bg-primary/10'
                                    )}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                  >
                                    <div className="flex items-center gap-1">
                                      <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                      {col.label}
                                    </div>
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sectionTasks.map((task) => (
                                <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                                  {columns.map((col) => (
                                    <TableCell key={col.id} className={col.width}>
                                      {renderCell(col.id, task)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </TaskSectionGroup>
                    );
                  })}

                  {/* Unsectioned tasks */}
                  {tasksBySection.unsectioned.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-b">
                        <span className="font-medium text-sm">Unsectioned</span>
                        <span className="text-xs text-muted-foreground">
                          ({tasksBySection.unsectioned.length})
                        </span>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {columns.map((col, index) => (
                              <TableHead
                                key={col.id}
                                className={cn(
                                  col.width,
                                  'cursor-grab select-none',
                                  draggedIndex === index && 'bg-primary/10'
                                )}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                              >
                                <div className="flex items-center gap-1">
                                  <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                                  {col.label}
                                </div>
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasksBySection.unsectioned.map((task) => (
                            <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                              {columns.map((col) => (
                                <TableCell key={col.id} className={col.width}>
                                  {renderCell(col.id, task)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Add Section Button */}
                  <div className="flex items-center gap-2">
                    {showNewSectionInput ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newSectionName}
                          onChange={(e) => setNewSectionName(e.target.value)}
                          placeholder="Section name..."
                          className="h-8 w-48 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSection();
                            if (e.key === 'Escape') {
                              setShowNewSectionInput(false);
                              setNewSectionName('');
                            }
                          }}
                        />
                        <Button size="sm" className="h-8" onClick={handleAddSection}>
                          Add
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8"
                          onClick={() => {
                            setShowNewSectionInput(false);
                            setNewSectionName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => setShowNewSectionInput(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Section
                      </Button>
                    )}
                  </div>
                </TooltipProvider>
              )}
            </TabsContent>
          </Tabs>

          <TaskEditDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            task={editingTask}
          />
        </div>
      </AppLayout>
    </>
  );
}
