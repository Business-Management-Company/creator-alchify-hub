import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { toast } from 'sonner';
import { 
  Search, 
  Grid3X3, 
  List, 
  Upload, 
  Video, 
  Music, 
  FileText,
  MoreVertical,
  Play,
  Trash2,
  Wand2,
  FolderOpen,
  Clock,
  HardDrive,
  Filter,
  Scissors,
  Download,
  Film
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VideoThumbnail from '@/components/VideoThumbnail';

type ViewMode = 'grid' | 'list';
type MediaFilter = 'all' | 'video' | 'audio';
type SortOption = 'newest' | 'oldest' | 'name' | 'size';
type LibraryTab = 'files' | 'clips' | 'exports';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  source_file_url: string | null;
  source_file_type: string | null;
  source_file_size: number | null;
  source_file_name: string | null;
  source_duration_seconds: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

interface ClipItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  platforms: string[] | null;
  score: number | null;
  render_status: string | null;
  render_url: string | null;
  created_at: string;
  project_id: string;
  project_title?: string;
}

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<LibraryTab>('files');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);

  // Fetch media files
  const { data: mediaItems, isLoading: filesLoading } = useQuery({
    queryKey: ['library-files', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
    enabled: !!user,
  });

  // Fetch clips
  const { data: clips, isLoading: clipsLoading } = useQuery({
    queryKey: ['library-clips', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('clips')
        .select('*, projects(title)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        project_title: c.projects?.title || 'Unknown Project',
      })) as ClipItem[];
    },
    enabled: !!user,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-files'] });
      toast.success('File deleted');
    },
    onError: () => toast.error('Failed to delete'),
  });

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    if (!mediaItems) return [];
    let items = [...mediaItems];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(q) || i.source_file_name?.toLowerCase().includes(q));
    }
    if (mediaFilter !== 'all') {
      items = items.filter(i => {
        const type = i.source_file_type || '';
        return mediaFilter === 'video' ? type.includes('video') : type.includes('audio');
      });
    }
    items.sort((a, b) => {
      switch (sortOption) {
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name': return a.title.localeCompare(b.title);
        case 'size': return (b.source_file_size || 0) - (a.source_file_size || 0);
        default: return 0;
      }
    });
    return items;
  }, [mediaItems, searchQuery, mediaFilter, sortOption]);

  // Stats
  const stats = useMemo(() => {
    if (!mediaItems) return { total: 0, videos: 0, audio: 0, totalSize: 0, clipCount: 0 };
    return {
      total: mediaItems.length,
      videos: mediaItems.filter(i => i.source_file_type?.includes('video')).length,
      audio: mediaItems.filter(i => i.source_file_type?.includes('audio')).length,
      totalSize: mediaItems.reduce((acc, i) => acc + (i.source_file_size || 0), 0),
      clipCount: clips?.length || 0,
    };
  }, [mediaItems, clips]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string | null) => {
    if (type?.includes('video')) return Video;
    if (type?.includes('audio')) return Music;
    return FileText;
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Please sign in to view your library.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Media Library</h1>
            <p className="text-muted-foreground">Browse and manage all your files, clips, and exports</p>
          </div>
          <Button onClick={() => navigate('/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <FolderOpen className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Video className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.videos}</p>
                  <p className="text-xs text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Music className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.audio}</p>
                  <p className="text-xs text-muted-foreground">Audio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20 text-accent-foreground">
                  <Scissors className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{stats.clipCount}</p>
                  <p className="text-xs text-muted-foreground">Clips</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                  <HardDrive className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatFileSize(stats.totalSize)}</p>
                  <p className="text-xs text-muted-foreground">Storage</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs: Files / Clips / Exports */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LibraryTab)}>
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <TabsList>
              <TabsTrigger value="files">
                <FolderOpen className="h-4 w-4 mr-1.5" />
                Files
              </TabsTrigger>
              <TabsTrigger value="clips">
                <Scissors className="h-4 w-4 mr-1.5" />
                Clips ({clips?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="exports">
                <Download className="h-4 w-4 mr-1.5" />
                Exports
              </TabsTrigger>
            </TabsList>

            {/* Search & View Toggle (for files tab) */}
            {activeTab === 'files' && (
              <div className="flex gap-2 items-center w-full md:w-auto">
                <div className="relative flex-1 md:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={mediaFilter} onValueChange={(v) => setMediaFilter(v as MediaFilter)}>
                  <SelectTrigger className="w-[110px]">
                    <Filter className="h-4 w-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex border border-border rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* FILES TAB */}
          <TabsContent value="files">
            {filesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery || mediaFilter !== 'all' ? 'No matches found' : 'No files yet'}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || mediaFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Upload your first file to get started'}
                  </p>
                  {!searchQuery && mediaFilter === 'all' && (
                    <Button onClick={() => navigate('/upload')}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredFiles.map((item) => {
                  const TypeIcon = getTypeIcon(item.source_file_type);
                  return (
                    <Card 
                      key={item.id} 
                      className="group border-border hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/refiner/${item.id}`)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-[16/9] h-28 bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center relative overflow-hidden">
                          <VideoThumbnail
                            sourceFileUrl={item.source_file_url}
                            sourceFileType={item.source_file_type}
                            className="w-full h-full"
                            showControls={false}
                          />
                          {item.source_duration_seconds && (
                            <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm text-xs px-2 py-1 rounded font-medium z-10">
                              {formatDuration(item.source_duration_seconds)}
                            </div>
                          )}
                          <div className="absolute top-2 left-2 z-10">
                            <div className="p-1.5 rounded-md bg-background/80 backdrop-blur-sm">
                              <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                        <div className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium truncate text-sm">{item.title}</h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                                <span>•</span>
                                {formatFileSize(item.source_file_size)}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/refiner/${item.id}`); }}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Open in Refiner
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setDeleteDialogOpen(true); }}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
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
            ) : (
              <Card className="border-border">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium text-sm">Name</th>
                        <th className="text-left p-4 font-medium text-sm hidden md:table-cell">Type</th>
                        <th className="text-left p-4 font-medium text-sm hidden sm:table-cell">Size</th>
                        <th className="text-left p-4 font-medium text-sm hidden lg:table-cell">Duration</th>
                        <th className="text-left p-4 font-medium text-sm hidden md:table-cell">Added</th>
                        <th className="text-right p-4 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((item) => {
                        const TypeIcon = getTypeIcon(item.source_file_type);
                        return (
                          <tr 
                            key={item.id} 
                            className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer"
                            onClick={() => navigate(`/refiner/${item.id}`)}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-muted">
                                  <TypeIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <span className="font-medium truncate max-w-[200px] text-sm">{item.title}</span>
                              </div>
                            </td>
                            <td className="p-4 text-muted-foreground text-sm hidden md:table-cell">
                              {item.source_file_type?.split('/')[1] || '—'}
                            </td>
                            <td className="p-4 text-muted-foreground text-sm hidden sm:table-cell">
                              {formatFileSize(item.source_file_size)}
                            </td>
                            <td className="p-4 text-muted-foreground text-sm hidden lg:table-cell">
                              {formatDuration(item.source_duration_seconds) || '—'}
                            </td>
                            <td className="p-4 text-muted-foreground text-sm hidden md:table-cell">
                              {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            </td>
                            <td className="p-4 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/refiner/${item.id}`); }}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Open in Refiner
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); setItemToDelete(item); setDeleteDialogOpen(true); }}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CLIPS TAB */}
          <TabsContent value="clips">
            {clipsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : !clips || clips.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <Scissors className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No clips yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Open a project in the Refiner to generate clips from your content
                  </p>
                  <Button onClick={() => navigate('/projects')}>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Go to Projects
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {clips.map((clip) => (
                  <Card key={clip.id} className="border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/20 text-primary flex-shrink-0">
                          <Film className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{clip.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            From: {clip.project_title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {clip.start_time} – {clip.end_time}
                            </Badge>
                            {clip.score && (
                              <Badge variant="secondary" className="text-xs">
                                Score: {clip.score}
                              </Badge>
                            )}
                          </div>
                          {clip.platforms && clip.platforms.length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {clip.platforms.map((p) => (
                                <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="default" className="flex-1" onClick={() => navigate(`/refiner/${clip.project_id}`)}>
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Open Project
                        </Button>
                        {clip.render_url && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={clip.render_url} download>
                              <Download className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* EXPORTS TAB */}
          <TabsContent value="exports">
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Download className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Export history coming soon</h3>
                <p className="text-muted-foreground text-center">
                  All your exported files will appear here for easy re-download
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this file?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{itemToDelete?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Library;
