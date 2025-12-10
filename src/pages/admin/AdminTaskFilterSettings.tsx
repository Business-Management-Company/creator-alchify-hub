import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, Loader2, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  useTaskFilterConfigs,
  useCreateFilterConfig,
  useUpdateFilterConfig,
  useDeleteFilterConfig,
  useReorderFilters,
  TaskFilterConfig,
} from '@/hooks/useTaskFilters';
import AppLayout from '@/components/layout/AppLayout';

const FIELD_OPTIONS = [
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'area', label: 'Area' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'created_at', label: 'Created At' },
  { value: 'updated_at', label: 'Updated At' },
  { value: 'assignee_id', label: 'Assignee' },
  { value: 'creator_id', label: 'Creator' },
];

const TYPE_OPTIONS = [
  { value: 'enum', label: 'Dropdown (enum)' },
  { value: 'date', label: 'Date' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'in', label: 'In (multiple)' },
  { value: 'between', label: 'Between' },
  { value: 'gte', label: 'Greater than or equal' },
  { value: 'lte', label: 'Less than or equal' },
  { value: 'contains', label: 'Contains' },
];

export default function AdminTaskFilterSettings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const { toast } = useToast();

  const { data: filters = [], isLoading } = useTaskFilterConfigs();
  const createFilter = useCreateFilterConfig();
  const updateFilter = useUpdateFilterConfig();
  const deleteFilter = useDeleteFilterConfig();
  const reorderFilters = useReorderFilters();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFilter, setEditingFilter] = useState<TaskFilterConfig | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    slug: '',
    field: '',
    type: 'enum' as TaskFilterConfig['type'],
    operator: 'equals' as TaskFilterConfig['operator'],
    options: '',
    visible_by_default: true,
  });
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  const resetForm = () => {
    setFormData({
      label: '',
      slug: '',
      field: '',
      type: 'enum',
      operator: 'equals',
      options: '',
      visible_by_default: true,
    });
    setEditingFilter(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (filter: TaskFilterConfig) => {
    if (filter.is_default) return;
    setEditingFilter(filter);
    setFormData({
      label: filter.label,
      slug: filter.slug,
      field: filter.field,
      type: filter.type,
      operator: filter.operator,
      options: filter.options?.join(', ') || '',
      visible_by_default: filter.visible_by_default,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    const optionsArray = formData.options
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    const payload = {
      label: formData.label,
      slug: formData.slug || formData.label.toLowerCase().replace(/\s+/g, '_'),
      field: formData.field,
      type: formData.type,
      operator: formData.operator,
      options: optionsArray,
      visible_by_default: formData.visible_by_default,
      display_order: editingFilter?.display_order || filters.length + 1,
    };

    if (editingFilter) {
      await updateFilter.mutateAsync({ id: editingFilter.id, ...payload });
    } else {
      await createFilter.mutateAsync(payload);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleVisibilityToggle = async (filter: TaskFilterConfig) => {
    await updateFilter.mutateAsync({
      id: filter.id,
      visible_by_default: !filter.visible_by_default,
    });
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const currentOrder = filters.map((f) => f.id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedId);

    reorderFilters.mutate(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
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
        <title>Task Filter Settings | Admin | Alchify</title>
      </Helmet>

      <AppLayout>
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/tasks')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Task Filter Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Configure and customize task filters.
              </p>
            </div>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Filter
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Filters</CardTitle>
              <CardDescription className="text-sm">
                Drag to reorder. Default filters are read-only but can be hidden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filters.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No filters configured.</p>
              ) : (
                <div className="space-y-2">
                  {filters.map((filter) => (
                    <div
                      key={filter.id}
                      draggable
                      onDragStart={() => handleDragStart(filter.id)}
                      onDragOver={(e) => handleDragOver(e, filter.id)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-muted/50 transition-colors ${
                        draggedId === filter.id ? 'opacity-50' : ''
                      }`}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{filter.label}</span>
                          {filter.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {filter.field} • {filter.type} • {filter.operator}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleVisibilityToggle(filter)}
                        >
                          {filter.visible_by_default ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>

                        {!filter.is_default && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(filter)}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Filter?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the "{filter.label}" filter.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFilter.mutate(filter.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingFilter ? 'Edit Filter' : 'New Filter'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Assigned User"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (optional)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., assigned_user"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field</Label>
                  <Select value={formData.field} onValueChange={(v) => setFormData({ ...formData, field: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v as TaskFilterConfig['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Operator</Label>
                <Select
                  value={formData.operator}
                  onValueChange={(v) => setFormData({ ...formData, operator: v as TaskFilterConfig['operator'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'enum' && (
                <div className="space-y-2">
                  <Label htmlFor="options">Options (comma-separated)</Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="e.g., Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label htmlFor="visible">Visible by default</Label>
                <Switch
                  id="visible"
                  checked={formData.visible_by_default}
                  onCheckedChange={(v) => setFormData({ ...formData, visible_by_default: v })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.label || !formData.field || createFilter.isPending || updateFilter.isPending}
              >
                {(createFilter.isPending || updateFilter.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingFilter ? 'Save Changes' : 'Create Filter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
}
