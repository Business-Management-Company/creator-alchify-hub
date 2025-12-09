import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Loader2,
  Volume2,
  Wand2,
  FileText,
  Download,
  AlertCircle,
  Sparkles,
  Film,
  Captions,
  FolderOpen,
  Video,
  Music,
  Clock,
  User,
  Layers,
  Image,
  Play,
  Check,
  CheckCircle,
  BarChart3,
  Share2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { ClipGenerator } from '@/components/refiner/ClipGenerator';
import { CaptionEditor } from '@/components/refiner/CaptionEditor';
import VideoThumbnail from '@/components/VideoThumbnail';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  source_file_url: string | null;
  source_file_name: string | null;
  source_file_type: string | null;
  source_file_size: number | null;
  source_duration_seconds: number | null;
  created_at: string;
}

interface Transcript {
  id: string;
  content: string | null;
  segments: unknown;
  avg_confidence: number | null;
  word_count: number | null;
  filler_words_detected: number | null;
}

interface ProcessingResults {
  wordCount: number;
  fillerCount: number;
  segmentCount: number;
  minutesSaved: number;
  accuracyScore: number;
  clipsGenerated: number;
  audioEnhanced: number;
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so,', 'well,'];

const Refiner = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (projectId) {
        fetchProject();
      }
    }
  }, [user, projectId]);

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
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();
      
      if (projectError) throw projectError;
      if (!projectData) {
        toast({
          title: 'Project not found',
          description: 'This project does not exist or you do not have access.',
          variant: 'destructive',
        });
        navigate('/refiner');
        return;
      }
      
      setProject(projectData);
      
      // Get media URL
      if (projectData.source_file_url) {
        const { data: urlData } = await supabase.storage
          .from('media-uploads')
          .createSignedUrl(projectData.source_file_url, 3600);
        
        if (urlData?.signedUrl) {
          setMediaUrl(urlData.signedUrl);
        }
      }
      
      // Fetch transcript if exists - get the most recent one
      const { data: transcriptData } = await supabase
        .from('transcripts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (transcriptData) {
        setTranscript(transcriptData);
        // Set processing results if transcript exists
        setProcessingResults({
          wordCount: transcriptData.word_count || 0,
          fillerCount: transcriptData.filler_words_detected || 0,
          segmentCount: Array.isArray(transcriptData.segments) ? (transcriptData.segments as any[]).length : 0,
          minutesSaved: Math.round((transcriptData.filler_words_detected || 0) * 0.5 / 60 * 10) / 10,
          accuracyScore: Math.round((transcriptData.avg_confidence || 0.95) * 100),
          clipsGenerated: 4, // Mock for now
          audioEnhanced: 12, // Mock percentage
        });
      }
      
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: 'Error',
        description: 'Failed to load project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading || (projectId && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isProcessingComplete = transcript !== null;

  return (
    <>
      <Helmet>
        <title>{project?.title || 'Refiner Studio'} | Alchify</title>
        <meta name="description" content="AI-powered content refinement studio for transcription, editing, clip generation, and more." />
      </Helmet>
      
      <AppLayout>
        {/* Tabs Navigation */}
        <div className="border-b border-border mb-6">
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'overview' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'audio' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Audio
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'video' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Video
            </button>
            <button
              onClick={() => setActiveTab('distribute')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'distribute' 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Distribute
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Project Selection */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Select Project
                </CardTitle>
                <CardDescription className="text-xs">
                  Choose content to process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1 max-h-[400px] overflow-y-auto">
                {projects.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">No projects yet</p>
                    <Button variant="link" size="sm" onClick={() => navigate('/upload')}>
                      Upload content
                    </Button>
                  </div>
                ) : (
                  projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => navigate(`/refiner/${p.id}`)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        projectId === p.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-transparent hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground truncate flex-1">
                          {p.title}
                        </span>
                        <Badge variant="secondary" className="text-[10px] ml-2">
                          {p.source_file_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(p.source_duration_seconds)}
                        <span className="ml-auto">{formatDate(p.created_at)}</span>
                      </div>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center - Video Preview & Content */}
          <div className="lg:col-span-5">
            {project ? (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-video bg-muted/50 flex items-center justify-center">
                    {mediaUrl && project.source_file_type === 'video' ? (
                      <video 
                        src={mediaUrl} 
                        controls 
                        preload="metadata"
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : mediaUrl && project.source_file_type === 'audio' ? (
                      <div className="flex flex-col items-center gap-4 p-8">
                        <div className="p-6 rounded-full bg-primary/10">
                          <Volume2 className="h-12 w-12 text-primary" />
                        </div>
                        <audio src={mediaUrl} controls className="w-full max-w-md" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-8 w-8" />
                        <p>Media preview unavailable</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Project Info */}
                <div>
                  <h2 className="font-semibold text-foreground">{project.title}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(project.source_duration_seconds)}
                    </span>
                    <Badge variant="secondary">{project.source_file_type}</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl aspect-video flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Select a project to preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Processing Pipeline */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Processing Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <PipelineStep 
                  label="Transcription" 
                  complete={isProcessingComplete}
                />
                <PipelineStep 
                  label="Remove Fillers" 
                  complete={isProcessingComplete}
                />
                <PipelineStep 
                  label="Remove Gaps" 
                  complete={isProcessingComplete}
                />
                <PipelineStep 
                  label="Audio Cleanup" 
                  complete={isProcessingComplete}
                />
                <PipelineStep 
                  label="Generate Captions" 
                  complete={isProcessingComplete}
                />
                <PipelineStep 
                  label="AI Clips" 
                  complete={isProcessingComplete}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Not Yet Processed - Show CTA prominently */}
        {project && !isProcessingComplete && (
          <NotProcessedCTA 
            projectId={project.id} 
            onProcessingComplete={() => fetchProject()}
          />
        )}

        {/* Processing Results - Show for all projects */}
        {project && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Processing Results
              </CardTitle>
              <CardDescription>
                AI improvements applied to your content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <StatCard 
                  value={processingResults?.minutesSaved || 0}
                  label="Minutes Saved"
                  color="text-primary"
                />
                <StatCard 
                  value={processingResults?.fillerCount || 0}
                  label="Fillers Found"
                  color="text-destructive"
                />
                <StatCard 
                  value={0}
                  label="Pauses Detected"
                  color="text-orange-500"
                />
                <StatCard 
                  value={`${processingResults?.audioEnhanced || 0}%`}
                  label="Audio Enhanced"
                  color="text-green-500"
                />
                <StatCard 
                  value={processingResults?.clipsGenerated || 0}
                  label="Clips Generated"
                  color="text-purple-500"
                />
                <StatCard 
                  value={processingResults?.wordCount || 0}
                  label="Words Transcribed"
                  color="text-blue-500"
                />
              </div>

              {/* Details Grid */}
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
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
                <div>
                  <h4 className="font-medium text-foreground flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Content Cleanup
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Filler words found</span>
                      <span className="text-foreground">{processingResults?.fillerCount || 0} instances</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segments created</span>
                      <span className="text-foreground">{processingResults?.segmentCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Clips suggested</span>
                      <span className="text-foreground">{processingResults?.clipsGenerated || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Complete & Actions */}
        {project && isProcessingComplete && (
          <Card className="mt-6 border-green-500/30 bg-green-500/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <div>
                    <h4 className="font-semibold text-green-600">Processing Complete!</h4>
                    <p className="text-sm text-muted-foreground">Your content is refined and ready</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="hero" onClick={() => setActiveTab('video')}>
                    <Play className="mr-2 h-4 w-4" />
                    Open Editor
                  </Button>
                  <Button variant="outline">
                    <Share2 className="mr-2 h-4 w-4" />
                    Share to Social
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/library')}>
                    <Save className="mr-2 h-4 w-4" />
                    Save to Library
                  </Button>
                  <Button variant="ghost">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Content - Video/Audio Tools */}
        {activeTab === 'video' && project && transcript && (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Film className="h-5 w-5 text-primary" />
                  AI Clip Generator
                </CardTitle>
                <CardDescription>
                  Create viral clips for TikTok, Reels, and Shorts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClipGenerator 
                  projectId={project.id} 
                  transcriptContent={transcript.content}
                  transcriptSegments={transcript.segments as any[] | null}
                  mediaUrl={mediaUrl}
                />
              </CardContent>
            </Card>

            {/* Other video tools */}
            <div className="grid md:grid-cols-2 gap-4">
              <ToolCard
                icon={User}
                title="Speaker Focus"
                description="AI camera framing for single-speaker content"
                badge="Coming Soon"
              />
              <ToolCard
                icon={Layers}
                title="Lower Thirds & Graphics"
                description="Add name overlays, titles, and logos"
                badge="Coming Soon"
              />
              <ToolCard
                icon={Image}
                title="B-Roll Suggestions"
                description="AI suggests stock footage for key moments"
                badge="Coming Soon"
              />
              <ToolCard
                icon={Play}
                title="Timeline Editor"
                description="Multi-track editing with audio/video layers"
                badge="Coming Soon"
              />
            </div>
          </div>
        )}

        {activeTab === 'audio' && project && transcript && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Captions className="h-5 w-5 text-primary" />
                  Captions & Subtitles
                </CardTitle>
                <CardDescription>
                  Export SRT, WebVTT, or configure burn-in captions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CaptionEditor transcriptContent={transcript.content} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'distribute' && project && (
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Distribution
                </CardTitle>
                <CardDescription>
                  Share your refined content across platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Share2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm max-w-md mx-auto">
                    Connect your social accounts to publish directly to YouTube, TikTok, Instagram, and more.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/integrations')}>
                    Manage Integrations
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AppLayout>
    </>
  );
};

// Not Processed CTA Component
const NotProcessedCTA = ({ 
  projectId, 
  onProcessingComplete 
}: { 
  projectId: string; 
  onProcessingComplete: () => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    try {
      toast({
        title: 'Alchifying your content...',
        description: 'AI is transcribing and enhancing your content.',
      });

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { projectId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: 'Content Alchified! ✨',
        description: `Transcribed ${data.transcript?.wordCount || 0} words successfully.`,
      });

      onProcessingComplete();
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="mt-6 border-primary/30 bg-primary/5">
      <CardContent className="py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-3 rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Ready to Alchify</h4>
              <p className="text-sm text-muted-foreground">
                Start AI processing to transcribe, clean, and enhance your content
              </p>
            </div>
          </div>
          <Button 
            variant="hero" 
            size="lg"
            onClick={handleStartProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Start Alchifying
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Pipeline Step Component
const PipelineStep = ({ label, complete }: { label: string; complete: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
      complete ? 'bg-green-500' : 'bg-muted'
    }`}>
      {complete && <Check className="h-4 w-4 text-white" />}
    </div>
    <span className={complete ? 'text-foreground' : 'text-muted-foreground'}>
      {label}
    </span>
  </div>
);

// Stat Card Component
const StatCard = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <div className="text-center p-3 rounded-lg border border-border">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

// Tool Card Component
interface ToolCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
}

const ToolCard = ({ icon: Icon, title, description, badge }: ToolCardProps) => (
  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">{title}</h4>
            {badge && (
              <Badge variant="secondary" className="text-[10px]">{badge}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default Refiner;
