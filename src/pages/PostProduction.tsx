import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import VideoThumbnail from '@/components/VideoThumbnail';
import { 
  Wand2, 
  Volume2, 
  Video, 
  Mic2, 
  Scissors, 
  Share2,
  Sparkles,
  BarChart3,
  Loader2,
  Check,
  Play,
  FolderOpen,
  Clock,
  Zap,
  Film,
  MessageSquare,
  Instagram,
  Youtube
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  status: string;
  source_file_url: string | null;
  source_file_type: string | null;
  source_duration_seconds: number | null;
  created_at: string;
}

interface ProcessingTask {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
}

const PostProduction = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Processing options
  const [removeFillers, setRemoveFillers] = useState(true);
  const [removeGaps, setRemoveGaps] = useState(true);
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [audioNormalization, setAudioNormalization] = useState(true);
  const [generateCaptions, setGenerateCaptions] = useState(true);
  const [generateClips, setGenerateClips] = useState(true);
  
  // Export settings
  const [exportFormat, setExportFormat] = useState('mp4');
  const [exportQuality, setExportQuality] = useState('1080p');
  const [distributeToIG, setDistributeToIG] = useState(false);
  const [distributeToFB, setDistributeToFB] = useState(false);
  const [distributeToYT, setDistributeToYT] = useState(false);

  const [tasks, setTasks] = useState<ProcessingTask[]>([
    { id: 'transcribe', name: 'Transcription', description: 'Generate accurate transcript', icon: MessageSquare, status: 'idle', progress: 0 },
    { id: 'fillers', name: 'Remove Fillers', description: 'Remove um, uh, like, etc.', icon: Scissors, status: 'idle', progress: 0 },
    { id: 'gaps', name: 'Remove Gaps', description: 'Cut dead air and long pauses', icon: Clock, status: 'idle', progress: 0 },
    { id: 'audio', name: 'Audio Cleanup', description: 'Noise reduction & normalization', icon: Volume2, status: 'idle', progress: 0 },
    { id: 'captions', name: 'Generate Captions', description: 'Sync captions with audio', icon: Film, status: 'idle', progress: 0 },
    { id: 'clips', name: 'AI Clips', description: 'Generate viral short clips', icon: Zap, status: 'idle', progress: 0 },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

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
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({ title: 'Error', description: 'Could not load projects', variant: 'destructive' });
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const startProcessing = async () => {
    if (!selectedProject) {
      toast({ title: 'No project selected', description: 'Please select a project to process', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing pipeline
    const enabledTasks = tasks.filter(task => {
      if (task.id === 'fillers') return removeFillers;
      if (task.id === 'gaps') return removeGaps;
      if (task.id === 'audio') return noiseReduction || audioNormalization;
      if (task.id === 'captions') return generateCaptions;
      if (task.id === 'clips') return generateClips;
      return true; // transcribe is always enabled
    });

    for (const task of enabledTasks) {
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'processing', progress: 0 } : t
      ));

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, progress: i } : t
        ));
      }

      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
      ));
    }

    setIsProcessing(false);
    setIsProcessingComplete(true);
    toast({ 
      title: 'Processing complete!', 
      description: 'Your content has been refined and is ready for export' 
    });
  };

  const resetTasks = () => {
    setTasks(prev => prev.map(t => ({ ...t, status: 'idle', progress: 0 })));
    setIsProcessingComplete(false);
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>AI Post Production Studio - Alchify</title>
        <meta name="description" content="AI-powered post production studio for audio cleanup, filler removal, clip generation, and social distribution" />
      </Helmet>

      <AppLayout>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                AI Post Production Studio
              </h1>
              <p className="text-muted-foreground mt-1">
                Transform raw content into polished, platform-ready assets
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Project Selection */}
            <Card className="xl:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Select Project
                </CardTitle>
                <CardDescription>
                  Choose content to process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                {isLoadingProjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No projects found</p>
                    <Button variant="link" onClick={() => navigate('/upload')}>
                      Upload content
                    </Button>
                  </div>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => { setSelectedProject(project); resetTasks(); }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedProject?.id === project.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium truncate">{project.title}</div>
                        <Badge variant="secondary" className="text-xs">
                          {project.source_file_type || 'video'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(project.source_duration_seconds)}
                        </span>
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Main Processing Area */}
            <div className="xl:col-span-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="distribute">Distribute</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Video Preview */}
                    <Card>
                      <CardContent className="p-0">
                        <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                          {selectedProject?.source_file_url ? (
                            <VideoThumbnail
                              sourceFileUrl={selectedProject.source_file_url}
                              sourceFileType={selectedProject.source_file_type}
                              className="w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <div className="text-center text-muted-foreground">
                                <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Select a project to preview</p>
                              </div>
                            </div>
                          )}
                          {/* Processing overlay */}
                          {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <div className="text-center">
                                <div className="relative">
                                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                                  <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <p className="text-white font-medium mt-4">AI Processing...</p>
                                <p className="text-white/70 text-sm mt-1">
                                  {tasks.find(t => t.status === 'processing')?.name || 'Preparing'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedProject && (
                          <div className="p-4 border-t border-border">
                            <h3 className="font-semibold truncate">{selectedProject.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDuration(selectedProject.source_duration_seconds)}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {selectedProject.source_file_type || 'video'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Processing Pipeline */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Processing Pipeline</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {tasks.map((task) => {
                          const Icon = task.icon;
                          return (
                            <div key={task.id} className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${
                                task.status === 'completed' ? 'bg-green-500/20 text-green-500' :
                                task.status === 'processing' ? 'bg-primary/20 text-primary' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {task.status === 'completed' ? (
                                  <Check className="h-4 w-4" />
                                ) : task.status === 'processing' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Icon className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium text-sm">{task.name}</div>
                                  {task.status === 'processing' && (
                                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                                  )}
                                </div>
                                {task.status === 'processing' && (
                                  <Progress value={task.progress} className="mt-1 h-1" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions based on state */}
                  {isProcessingComplete ? (
                    <>
                      {/* Processing Results Analytics */}
                      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Processing Results
                          </CardTitle>
                          <CardDescription>AI improvements applied to your content</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                              <div className="text-3xl font-bold text-primary">4.2</div>
                              <div className="text-xs text-muted-foreground mt-1">Minutes Saved</div>
                            </div>
                            <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                              <div className="text-3xl font-bold text-accent">23</div>
                              <div className="text-xs text-muted-foreground mt-1">Fillers Removed</div>
                            </div>
                            <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                              <div className="text-3xl font-bold text-green-500">8</div>
                              <div className="text-xs text-muted-foreground mt-1">Pauses Removed</div>
                            </div>
                            <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                              <div className="text-3xl font-bold text-blue-500">12%</div>
                              <div className="text-xs text-muted-foreground mt-1">Audio Enhanced</div>
                            </div>
                            <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                              <div className="text-3xl font-bold text-purple-500">3</div>
                              <div className="text-xs text-muted-foreground mt-1">Clips Generated</div>
                            </div>
                            <div className="bg-card/50 rounded-xl p-4 text-center border border-border">
                              <div className="text-3xl font-bold text-yellow-500">96%</div>
                              <div className="text-xs text-muted-foreground mt-1">Accuracy Score</div>
                            </div>
                          </div>
                          
                          {/* Detailed Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Volume2 className="h-4 w-4 text-blue-500" />
                                Audio Enhancement
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Noise Reduction</span>
                                  <span className="text-foreground">-18dB removed</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Normalization</span>
                                  <span className="text-foreground">-14 LUFS</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Dynamic Range</span>
                                  <span className="text-foreground">Optimized</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-muted/30 rounded-lg p-4">
                              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Video className="h-4 w-4 text-purple-500" />
                                Content Cleanup
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">um, uh removed</span>
                                  <span className="text-foreground">18 instances</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">"like" removed</span>
                                  <span className="text-foreground">5 instances</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Silent gaps cut</span>
                                  <span className="text-foreground">42 seconds</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-green-500/30 bg-green-500/5">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-green-500/20">
                              <Check className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-green-500">Processing Complete!</h3>
                              <p className="text-sm text-muted-foreground">Your content is refined and ready</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <Button onClick={() => selectedProject && navigate(`/refiner/${selectedProject.id}`)}>
                              <Play className="h-4 w-4 mr-2" />
                              Open Editor
                            </Button>
                            <Button variant="outline">
                              <Share2 className="h-4 w-4 mr-2" />
                              Share to Social
                            </Button>
                            <Button variant="outline">
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Save to Library
                            </Button>
                            <Button variant="secondary">
                              <Wand2 className="h-4 w-4 mr-2" />
                              Export
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={startProcessing}
                      disabled={!selectedProject || isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-5 w-5 mr-2" />
                          Start AI Processing
                        </>
                      )}
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="audio" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        Audio Processing
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="font-medium">Speech Cleanup</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="remove-fillers">Remove Filler Words</Label>
                              <Switch id="remove-fillers" checked={removeFillers} onCheckedChange={setRemoveFillers} />
                            </div>
                            <p className="text-xs text-muted-foreground">Removes um, uh, like, you know, etc.</p>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="remove-gaps">Remove Dead Air</Label>
                              <Switch id="remove-gaps" checked={removeGaps} onCheckedChange={setRemoveGaps} />
                            </div>
                            <p className="text-xs text-muted-foreground">Cuts long pauses and silence</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h4 className="font-medium">Audio Enhancement</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="noise-reduction">Noise Reduction</Label>
                              <Switch id="noise-reduction" checked={noiseReduction} onCheckedChange={setNoiseReduction} />
                            </div>
                            <p className="text-xs text-muted-foreground">Remove background noise</p>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="normalization">Volume Normalization</Label>
                              <Switch id="normalization" checked={audioNormalization} onCheckedChange={setAudioNormalization} />
                            </div>
                            <p className="text-xs text-muted-foreground">Consistent audio levels</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="video" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Video & Clips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="captions">Auto-Generate Captions</Label>
                            <p className="text-xs text-muted-foreground">Burned-in animated captions</p>
                          </div>
                          <Switch id="captions" checked={generateCaptions} onCheckedChange={setGenerateCaptions} />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="clips">AI Clip Generation</Label>
                            <p className="text-xs text-muted-foreground">Auto-detect viral moments</p>
                          </div>
                          <Switch id="clips" checked={generateClips} onCheckedChange={setGenerateClips} />
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-4">
                        <h4 className="font-medium">Export Settings</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Format</Label>
                            <Select value={exportFormat} onValueChange={setExportFormat}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="mp4">MP4</SelectItem>
                                <SelectItem value="mov">MOV</SelectItem>
                                <SelectItem value="webm">WebM</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Quality</Label>
                            <Select value={exportQuality} onValueChange={setExportQuality}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="720p">720p</SelectItem>
                                <SelectItem value="1080p">1080p (HD)</SelectItem>
                                <SelectItem value="4k">4K</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="distribute" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Distribution
                      </CardTitle>
                      <CardDescription>
                        Publish directly to social platforms
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={() => setDistributeToIG(!distributeToIG)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            distributeToIG ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Instagram className="h-8 w-8 mx-auto mb-2" />
                          <div className="font-medium">Instagram</div>
                          <div className="text-xs text-muted-foreground">Reels & Stories</div>
                          {!distributeToIG && (
                            <Badge variant="outline" className="mt-2">Connect</Badge>
                          )}
                        </button>

                        <button
                          onClick={() => setDistributeToFB(!distributeToFB)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            distributeToFB ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <svg className="h-8 w-8 mx-auto mb-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          <div className="font-medium">Facebook</div>
                          <div className="text-xs text-muted-foreground">Videos & Reels</div>
                          {!distributeToFB && (
                            <Badge variant="outline" className="mt-2">Connect</Badge>
                          )}
                        </button>

                        <button
                          onClick={() => setDistributeToYT(!distributeToYT)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            distributeToYT ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Youtube className="h-8 w-8 mx-auto mb-2" />
                          <div className="font-medium">YouTube</div>
                          <div className="text-xs text-muted-foreground">Videos & Shorts</div>
                          {!distributeToYT && (
                            <Badge variant="outline" className="mt-2">Connect</Badge>
                          )}
                        </button>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                        <p>Connect your social accounts in Settings → Integrations to enable direct publishing.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default PostProduction;
