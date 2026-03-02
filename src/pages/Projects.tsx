import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  FolderOpen, 
  Plus, 
  Clock, 
  Loader2,
  MoreVertical,
  Trash2,
  Wand2,
  Download,
  Scissors,
  ArrowRight,
  CheckCircle2,
  FileAudio,
  FileVideo,
  Upload as UploadIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import VideoThumbnail from '@/components/VideoThumbnail';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  source_file_url: string | null;
  source_file_type: string | null;
  source_file_size: number | null;
  created_at: string;
  updated_at: string;
  clip_count?: number;
  has_transcript?: boolean;
}

type StatusFilter = 'all' | 'uploaded' | 'transcribing' | 'editing' | 'ready' | 'exported';

const PIPELINE_STAGES = ['uploaded', 'transcribing', 'editing', 'ready', 'exported'] as const;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; color: string; step: number }> = {
  uploaded: { label: 'Uploaded', variant: 'secondary', color: 'text-muted-foreground', step: 1 },
  transcribing: { label: 'Transcribing', variant: 'default', color: 'text-blue-400', step: 2 },
  editing: { label: 'Editing', variant: 'default', color: 'text-primary', step: 3 },
  ready: { label: 'Ready', variant: 'outline', color: 'text-green-400', step: 4 },
  exported: { label: 'Exported', variant: 'outline', color: 'text-purple-400', step: 5 },
};

const Projects = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;

      const projectIds = (data || []).map(p => p.id);
      let clipCounts: Record<string, number> = {};
      let transcriptMap: Record<string, boolean> = {};

      if (projectIds.length > 0) {
        const [clipsResult, transcriptsResult] = await Promise.all([
          supabase.from('clips').select('project_id').in('project_id', projectIds),
          supabase.from('transcripts').select('project_id').in('project_id', projectIds),
        ]);

        if (clipsResult.data) {
          clipsResult.data.forEach((c: any) => {
            clipCounts[c.project_id] = (clipCounts[c.project_id] || 0) + 1;
          });
        }
        if (transcriptsResult.data) {
          transcriptsResult.data.forEach((t: any) => {
            transcriptMap[t.project_id] = true;
          });
        }
      }

      setProjects((data || []).map(p => ({
        ...p,
        clip_count: clipCounts[p.id] || 0,
        has_transcript: transcriptMap[p.id] || false,
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProject) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', deleteProject.id);
      if (error) throw error;
      setProjects(prev => prev.filter(p => p.id !== deleteProject.id));
      toast({ title: 'Project deleted', description: 'The project has been removed.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete project', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteProject(null);
    }
  };

  const filteredProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    return projects.filter(p => p.status === statusFilter);
  }, [projects, statusFilter]);

  // Pipeline summary counts
  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => counts[s] = 0);
    projects.forEach(p => {
      if (counts[p.status] !== undefined) counts[p.status]++;
    });
    return counts;
  }, [projects]);

  const getProgressValue = (status: string) => {
    const step = statusConfig[status]?.step || 1;
    return (step / PIPELINE_STAGES.length) * 100;
  };

  const getNextAction = (project: Project) => {
    switch (project.status) {
      case 'uploaded':
        return { label: 'Start Refining', icon: Wand2 };
      case 'transcribing':
        return { label: 'View Progress', icon: Loader2 };
      case 'editing':
        return { label: 'Continue Editing', icon: Wand2 };
      case 'ready':
        return { label: 'Export Now', icon: Download };
      case 'exported':
        return { label: 'View Project', icon: FolderOpen };
      default:
        return { label: 'Open', icon: ArrowRight };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Projects | Alchify</title>
        <meta name="description" content="Manage your content pipeline — track projects from upload to export." />
      </Helmet>
      
      <AppLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Projects</h1>
            <p className="text-muted-foreground">Your content editing pipeline</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/upload">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {/* Pipeline Summary */}
        {projects.length > 0 && (
          <div className="grid grid-cols-5 gap-3 mb-6">
            {PIPELINE_STAGES.map((stage) => (
              <Card
                key={stage}
                className={`border cursor-pointer transition-all ${statusFilter === stage ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                onClick={() => setStatusFilter(statusFilter === stage ? 'all' : stage)}
              >
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold">{stageCounts[stage]}</p>
                  <p className={`text-xs font-medium ${statusConfig[stage].color}`}>
                    {statusConfig[stage].label}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Filter Tabs */}
        {projects.length > 0 && (
          <div className="mb-6">
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <TabsList>
                <TabsTrigger value="all">All ({projects.length})</TabsTrigger>
                <TabsTrigger value="uploaded">Uploaded</TabsTrigger>
                <TabsTrigger value="transcribing">Transcribing</TabsTrigger>
                <TabsTrigger value="editing">Editing</TabsTrigger>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="exported">Exported</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        {/* Projects List */}
        {filteredProjects.length === 0 && projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-4">
              <FolderOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Upload your first video or audio file to start the refinement pipeline.
            </p>
            <Button variant="hero" asChild>
              <Link to="/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload Content
              </Link>
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">No projects in "{statusConfig[statusFilter]?.label}" stage</p>
            <Button variant="ghost" className="mt-2" onClick={() => setStatusFilter('all')}>Show all</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const nextAction = getNextAction(project);
              const NextIcon = nextAction.icon;
              return (
                <Card
                  key={project.id}
                  className="border-border hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => navigate(`/refiner/${project.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0">
                        <VideoThumbnail
                          sourceFileUrl={project.source_file_url}
                          sourceFileType={project.source_file_type}
                          className="w-full h-full"
                          showControls={false}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">{project.title}</h3>
                          <Badge variant={statusConfig[project.status]?.variant || 'secondary'} className="flex-shrink-0">
                            {statusConfig[project.status]?.label || project.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(project.updated_at)}
                          </span>
                          <span>{formatFileSize(project.source_file_size)}</span>
                          {project.source_file_type?.includes('video') && (
                            <span className="flex items-center gap-1"><FileVideo className="h-3 w-3" /> Video</span>
                          )}
                          {project.source_file_type?.includes('audio') && (
                            <span className="flex items-center gap-1"><FileAudio className="h-3 w-3" /> Audio</span>
                          )}
                          {(project.clip_count ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-primary">
                              <Scissors className="h-3 w-3" /> {project.clip_count} clips
                            </span>
                          )}
                          {project.has_transcript && (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle2 className="h-3 w-3" /> Transcribed
                            </span>
                          )}
                        </div>
                        {/* Pipeline Progress */}
                        <Progress value={getProgressValue(project.status)} className="h-1.5" />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => { e.stopPropagation(); navigate(`/refiner/${project.id}`); }}
                        >
                          <NextIcon className={`mr-1.5 h-3.5 w-3.5 ${project.status === 'transcribing' ? 'animate-spin' : ''}`} />
                          {nextAction.label}
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/refiner/${project.id}`); }}>
                              <Wand2 className="mr-2 h-4 w-4" />
                              Open in Refiner
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => { e.stopPropagation(); setDeleteProject(project); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteProject?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </>
  );
};

export default Projects;
