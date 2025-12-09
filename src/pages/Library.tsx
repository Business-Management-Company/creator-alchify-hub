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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Filter
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import VideoThumbnail from '@/components/VideoThumbnail';

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'video' | 'audio' | 'processing';
type SortOption = 'newest' | 'oldest' | 'name' | 'size';

interface MediaItem {
  id: string;
  title: string;
  description: string | null;
  source_file_url: string | null;
  source_file_type: string | null;
  source_file_size: number | null;
  source_duration_seconds: number | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all media items
  const { data: mediaItems, isLoading } = useQuery({
    queryKey: ['library-media', user?.id],
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-media'] });
      toast.success('Item deleted');
    },
    onError: () => {
      toast.error('Failed to delete item');
    },
  });

  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!mediaItems) return [];
    
    let items = [...mediaItems];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      items = items.filter(item => {
        const type = item.source_file_type || '';
        if (filterType === 'video') return type.includes('video');
        if (filterType === 'audio') return type.includes('audio');
        if (filterType === 'processing') return ['transcribing', 'processing'].includes(item.status || '');
        return true;
      });
    }
    
    // Apply sorting
    items.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.title.localeCompare(b.title);
        case 'size':
          return (b.source_file_size || 0) - (a.source_file_size || 0);
        default:
          return 0;
      }
    });
    
    return items;
  }, [mediaItems, searchQuery, filterType, sortOption]);

  // Stats
  const stats = useMemo(() => {
    if (!mediaItems) return { total: 0, videos: 0, audio: 0, totalSize: 0 };
    
    const videos = mediaItems.filter(i => i.source_file_type?.includes('video')).length;
    const audio = mediaItems.filter(i => i.source_file_type?.includes('audio')).length;
    const totalSize = mediaItems.reduce((acc, i) => acc + (i.source_file_size || 0), 0);
    
    return { total: mediaItems.length, videos, audio, totalSize };
  }, [mediaItems]);

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'uploaded':
        return <Badge variant="secondary">Uploaded</Badge>;
      case 'transcribing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Transcribing...</Badge>;
      case 'editing':
        return (
          <Badge className="bg-primary/20 text-primary border-primary/30">
            <Wand2 className="h-3 w-3 mr-1" />
            Alchified
          </Badge>
        );
      case 'exported':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Exported</Badge>;
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const handleQuickAction = (action: string, item: MediaItem) => {
    switch (action) {
      case 'open':
        navigate(`/refiner/${item.id}`);
        break;
      case 'post-production':
        navigate('/post-production', { state: { selectedProject: item.id } });
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this item?')) {
          deleteMutation.mutate(item.id);
        }
        break;
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
            <p className="text-muted-foreground">All your uploads, recordings, and exports in one place</p>
          </div>
          <Button onClick={() => navigate('/upload')}>
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20 text-primary">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.videos}</p>
                  <p className="text-sm text-muted-foreground">Videos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                  <Music className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.audio}</p>
                  <p className="text-sm text-muted-foreground">Audio</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
                  <HardDrive className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="video">Videos</TabsTrigger>
                <TabsTrigger value="audio">Audio</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
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
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || filterType !== 'all' ? 'No matches found' : 'Your library is empty'}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first video or audio file to get started'}
              </p>
              {!searchQuery && filterType === 'all' && (
                <Button onClick={() => navigate('/upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const TypeIcon = getTypeIcon(item.source_file_type);
              return (
                <Card 
                  key={item.id} 
                  className="group border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/refiner/${item.id}`)}
                >
                  <CardContent className="p-0">
                    {/* Thumbnail */}
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
                      <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                        <Button size="sm" variant="default" onClick={(e) => {
                          e.stopPropagation();
                          handleQuickAction('open', item);
                        }}>
                          <Play className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                            <span>•</span>
                            {formatFileSize(item.source_file_size)}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleQuickAction('open', item)}>
                              <Play className="h-4 w-4 mr-2" />
                              Open in Refiner
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAction('post-production', item)}>
                              <Wand2 className="h-4 w-4 mr-2" />
                              Post Production
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleQuickAction('delete', item)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List View */
          <Card className="border-border">
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Type</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Size</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Duration</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Date</th>
                    <th className="text-right p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
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
                            <span className="font-medium truncate max-w-[200px]">{item.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
                          {item.source_file_type?.split('/')[1] || 'Unknown'}
                        </td>
                        <td className="p-4 text-muted-foreground hidden sm:table-cell">
                          {formatFileSize(item.source_file_size)}
                        </td>
                        <td className="p-4 text-muted-foreground hidden lg:table-cell">
                          {formatDuration(item.source_duration_seconds) || '—'}
                        </td>
                        <td className="p-4">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">
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
                              <DropdownMenuItem onClick={() => handleQuickAction('open', item)}>
                                <Play className="h-4 w-4 mr-2" />
                                Open in Refiner
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickAction('post-production', item)}>
                                <Wand2 className="h-4 w-4 mr-2" />
                                Post Production
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleQuickAction('delete', item)}
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
      </div>
    </AppLayout>
  );
};

export default Library;
