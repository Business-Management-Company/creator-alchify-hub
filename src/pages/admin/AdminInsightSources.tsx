import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Database, 
  Plus, 
  Loader2, 
  RefreshCw, 
  Pause, 
  Play,
  Trash2,
  ExternalLink,
  Rss,
  Globe,
  FileText,
  Tag,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { apiPost } from '@/lib/api';

interface InsightSource {
  id: string;
  name: string;
  type: string;
  url: string;
  tags: string[];
  creator_type_tags: string[];
  topic_tags: string[];
  is_active: boolean;
  use_transcripts: boolean;
  last_fetch_at: string | null;
  documents_count: number;
  created_at: string;
}

const AdminInsightSources = () => {
  const { toast } = useToast();
  const [sources, setSources] = useState<InsightSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isScraping, setIsScraping] = useState<string | null>(null);

  // New source form state
  const [newSource, setNewSource] = useState({
    name: '',
    type: 'rss' as 'firecrawl' | 'rss',
    url: '',
    tags: '',
    creatorTypeTags: '',
    topicTags: '',
    useTranscripts: false,
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('insight_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error fetching sources:', error);
      toast({
        title: 'Error',
        description: 'Failed to load insight sources',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSource = async () => {
    if (!newSource.name || !newSource.url) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in name and URL',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await apiPost('/admin/insight-sources', {
        name: newSource.name,
        type: newSource.type,
        url: newSource.url,
        tags: newSource.tags.split(',').map(t => t.trim()).filter(Boolean),
        creator_type_tags: newSource.creatorTypeTags.split(',').map(t => t.trim()).filter(Boolean),
        topic_tags: newSource.topicTags.split(',').map(t => t.trim()).filter(Boolean),
        use_transcripts: newSource.useTranscripts,
        is_active: true,
      });

      if (error) throw error;

      toast({ title: 'Source added', description: 'New insight source created successfully' });
      setIsAddDialogOpen(false);
      setNewSource({
        name: '',
        type: 'rss',
        url: '',
        tags: '',
        creatorTypeTags: '',
        topicTags: '',
        useTranscripts: false,
      });
      fetchSources();
    } catch (error) {
      console.error('Error adding source:', error);
      toast({ title: 'Error', description: 'Failed to add source', variant: 'destructive' });
    }
  };

  const toggleSourceStatus = async (sourceId: string, currentStatus: boolean) => {
    try {
      const { error } = await apiPost(`/admin/insight-sources/${sourceId}`, {
        is_active: !currentStatus,
        _method: 'PATCH'
      });

      if (error) throw error;

      setSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, is_active: !currentStatus } : s
      ));

      toast({ title: currentStatus ? 'Source paused' : 'Source activated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update source', variant: 'destructive' });
    }
  };

  const scrapeSource = async (source: InsightSource) => {
    setIsScraping(source.id);
    try {
      const endpoint = source.type === 'rss' ? '/insight-ingest-rss' : '/insight-ingest-firecrawl';
      const action = source.type === 'rss' ? 'fetchSource' : 'scrapeSource';

      const { data, error } = await apiPost<{ success?: boolean; processed?: number; error?: string }>(endpoint, {
        action, sourceId: source.id
      });

      if (error) throw error;

      toast({
        title: 'Scrape complete',
        description: data.success 
          ? `Processed ${data.processed || 1} document(s)` 
          : data.error || 'Unknown error',
      });

      fetchSources(); // Refresh to get updated counts
    } catch (error) {
      console.error('Scrape error:', error);
      toast({ title: 'Scrape failed', description: String(error), variant: 'destructive' });
    } finally {
      setIsScraping(null);
    }
  };

  const deleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source and all its documents?')) return;

    try {
      const { error } = await apiPost(`/admin/insight-sources/${sourceId}`, { _method: 'DELETE' });

      if (error) throw error;

      setSources(prev => prev.filter(s => s.id !== sourceId));
      toast({ title: 'Source deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete source', variant: 'destructive' });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Helmet>
        <title>Insight Sources | Admin | Alchify</title>
      </Helmet>

      <AppLayout>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              Insight Sources
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage Firecrawl and RSS sources that feed the Insights Corpus
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={fetchSources}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Insight Source</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Source Name</Label>
                    <Input
                      placeholder="e.g., Buzzsprout Blog"
                      value={newSource.name}
                      onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newSource.type}
                      onValueChange={(value: 'rss' | 'firecrawl') => setNewSource(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rss">
                          <div className="flex items-center gap-2">
                            <Rss className="h-4 w-4" />
                            RSS Feed
                          </div>
                        </SelectItem>
                        <SelectItem value="firecrawl">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Firecrawl (Web Scrape)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>URL</Label>
                    <Input
                      placeholder="https://example.com/feed.xml"
                      value={newSource.url}
                      onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      placeholder="podcast, creator-economy, marketing"
                      value={newSource.tags}
                      onChange={(e) => setNewSource(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Creator Type Tags</Label>
                    <Input
                      placeholder="creator, podcaster, agency"
                      value={newSource.creatorTypeTags}
                      onChange={(e) => setNewSource(prev => ({ ...prev, creatorTypeTags: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Topic Tags</Label>
                    <Input
                      placeholder="monetization, growth, analytics"
                      value={newSource.topicTags}
                      onChange={(e) => setNewSource(prev => ({ ...prev, topicTags: e.target.value }))}
                    />
                  </div>

                  {newSource.type === 'rss' && (
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={newSource.useTranscripts}
                        onCheckedChange={(checked) => setNewSource(prev => ({ ...prev, useTranscripts: checked }))}
                      />
                      <Label>Use transcripts for insights (if audio available)</Label>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSource}>
                    Add Source
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">{sources.length}</div>
            <div className="text-sm text-muted-foreground">Total Sources</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-green-500">
              {sources.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">
              {sources.reduce((acc, s) => acc + (s.documents_count || 0), 0)}
            </div>
            <div className="text-sm text-muted-foreground">Documents</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-2xl font-bold text-foreground">
              {sources.filter(s => s.type === 'rss').length}
            </div>
            <div className="text-sm text-muted-foreground">RSS Feeds</div>
          </div>
        </div>

        {/* Sources Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Last Fetch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No insight sources configured yet
                  </TableCell>
                </TableRow>
              ) : (
                sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${source.type === 'rss' ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
                          {source.type === 'rss' ? (
                            <Rss className="h-4 w-4 text-orange-500" />
                          ) : (
                            <Globe className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{source.name}</div>
                          <a 
                            href={source.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            {source.url.slice(0, 40)}...
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {source.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {source.tags?.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {source.tags?.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{source.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {source.documents_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDate(source.last_fetch_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={source.is_active ? 'default' : 'secondary'}
                        className={source.is_active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                      >
                        {source.is_active ? 'Active' : 'Paused'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => scrapeSource(source)}
                          disabled={isScraping === source.id}
                          title="Fetch now"
                        >
                          {isScraping === source.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleSourceStatus(source.id, source.is_active)}
                          title={source.is_active ? 'Pause' : 'Activate'}
                        >
                          {source.is_active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSource(source.id)}
                          className="text-destructive hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AppLayout>
    </>
  );
};

export default AdminInsightSources;
