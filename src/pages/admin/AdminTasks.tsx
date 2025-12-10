import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { TaskStatusBadge } from '@/components/tasks/TaskStatusBadge';
import { TaskPriorityBadge } from '@/components/tasks/TaskPriorityBadge';
import { TaskEditDrawer } from '@/components/tasks/TaskEditDrawer';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { Task, TaskStatus, TaskPriority, AREA_OPTIONS } from '@/types/tasks';
import { format, isPast, isThisWeek, addDays, isBefore } from 'date-fns';

export default function AdminTasks() {
  const [activeTab, setActiveTab] = useState<'my' | 'created' | 'all'>('my');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [dueFilter, setDueFilter] = useState<string>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { isAdmin } = useAdminCheck();
  const { data: tasks = [], isLoading } = useTasks(activeTab);
  const updateTask = useUpdateTask();

  const filteredTasks = tasks.filter((task) => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (areaFilter !== 'all' && task.area !== areaFilter) return false;
    
    if (dueFilter !== 'all') {
      const dueDate = task.due_date ? new Date(task.due_date) : null;
      if (dueFilter === 'overdue' && (!dueDate || !isPast(dueDate) || task.status === 'done')) return false;
      if (dueFilter === 'this_week' && (!dueDate || !isThisWeek(dueDate))) return false;
      if (dueFilter === 'next_30' && (!dueDate || !isBefore(dueDate, addDays(new Date(), 30)))) return false;
      if (dueFilter === 'no_date' && dueDate) return false;
    }
    
    return true;
  });

  const handleNewTask = () => {
    setEditingTask(null);
    setDrawerOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDrawerOpen(true);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTask.mutate({ id: taskId, status });
  };

  const handlePriorityChange = (taskId: string, priority: TaskPriority) => {
    updateTask.mutate({ id: taskId, priority });
  };

  const getEmptyState = () => {
    switch (activeTab) {
      case 'my': return "You don't have any tasks yet.";
      case 'created': return "You haven't created any tasks yet.";
      default: return "No tasks found.";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage and track team tasks</p>
        </div>
        <Button onClick={handleNewTask}>
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my' | 'created' | 'all')}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="my">My Tasks</TabsTrigger>
            <TabsTrigger value="created">Created by Me</TabsTrigger>
            {isAdmin && <TabsTrigger value="all">All Tasks</TabsTrigger>}
          </TabsList>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-[120px] h-8">
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {AREA_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={dueFilter} onValueChange={setDueFilter}>
              <SelectTrigger className="w-[130px] h-8">
                <SelectValue placeholder="Due" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="next_30">Next 30 Days</SelectItem>
                <SelectItem value="no_date">No Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {getEmptyState()}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead className="w-[150px]">Owner</TableHead>
                    <TableHead className="w-[100px]">Area</TableHead>
                    <TableHead className="w-[100px]">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <TaskStatusBadge
                          status={task.status}
                          editable
                          onChange={(status) => handleStatusChange(task.id, status)}
                        />
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/admin/tasks/${task.id}`}
                          className="font-medium hover:underline flex items-center gap-1"
                        >
                          {task.title}
                          {task.linked_url && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </Link>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <TaskPriorityBadge
                          priority={task.priority}
                          editable
                          onChange={(priority) => handlePriorityChange(task.id, priority)}
                        />
                      </TableCell>
                      <TableCell>
                        {task.assignee ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {(task.assignee.display_name || 'U')[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm truncate max-w-[100px]">
                              {task.assignee.display_name || 'Unknown'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {task.area || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.due_date ? (
                          <span className={`text-sm ${isPast(new Date(task.due_date)) && task.status !== 'done' ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                            {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TaskEditDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        task={editingTask}
      />
    </div>
  );
}
