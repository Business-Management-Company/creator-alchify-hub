import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
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
  Plus,
  Video,
  Music,
  Clock,
  User,
  Layers,
  Image,
  Play,
  Check,
  BarChart3,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { ClipGenerator } from '@/components/refiner/ClipGenerator';
import { CaptionEditor } from '@/components/refiner/CaptionEditor';
import VideoThumbnail from '@/components/VideoThumbnail';
import { extractAudioFromVideo, needsAudioExtraction } from '@/lib/audio-extraction';

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
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so,', 'well,'];

const removeFillerWords = (content: string): { cleaned: string; removedCount: number } => {
  let cleaned = content;
  let removedCount = 0;
  
  FILLER_WORDS.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b\\s*,?\\s*`, 'gi');
    const matches = cleaned.match(regex);
    if (matches) {
      removedCount += matches.length;
    }
    cleaned = cleaned.replace(regex, '');
  });
  
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/\s*,\s*,/g, ',').trim();
  
  return { cleaned, removedCount };
};

// Tool types for the unified studio
type ActiveTool = 'transcript' | 'clips' | 'captions' | 'speaker-focus' | 'lower-thirds' | 'b-roll' | 'timeline' | null;

const Refiner = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRemovingFillers, setIsRemovingFillers] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [processingResults, setProcessingResults] = useState<ProcessingResults | null>(null);
  
  // Processing options
  const [autoRemoveFillers, setAutoRemoveFillers] = useState(false);
  const [autoNoiseReduction, setAutoNoiseReduction] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    } else if (user && !projectId) {
      fetchProjects();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchProject = async () => {
    try {
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
        navigate('/projects');
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
          segmentCount: 0,
          minutesSaved: Math.round((transcriptData.filler_words_detected || 0) * 0.5 / 60 * 10) / 10,
          accuracyScore: Math.round((transcriptData.avg_confidence || 0.95) * 100),
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

  const startTranscription = async () => {
    if (!project) return;
    
    setIsTranscribing(true);
    
    try {
      setProject(prev => prev ? { ...prev, status: 'transcribing' } : null);
      
      let audioData: string | undefined;
      
      const fileSize = project.source_file_size || 0;
      if (needsAudioExtraction(fileSize)) {
        toast({
          title: 'Extracting audio...',
          description: 'Your file is large, extracting audio for faster transcription.',
        });
        
        if (!project.source_file_url) {
          throw new Error('No source file URL found');
        }
        
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('media-uploads')
          .createSignedUrl(project.source_file_url, 3600);
        
        if (urlError || !signedUrlData?.signedUrl) {
          throw new Error('Failed to get file URL for audio extraction');
        }
        
        const { audioBlob } = await extractAudioFromVideo(signedUrlData.signedUrl);
        
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        audioData = btoa(binaryString);
        
        console.log(`Extracted audio: ${audioBlob.size} bytes (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB)`);
      }
      
      toast({
        title: 'AI Processing Started',
        description: 'Transcribing your content. This may take a moment.',
      });
      
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { 
          projectId: project.id,
          audioData: audioData
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Log AI action
      await supabase.from('ai_action_log').insert({
        project_id: project.id,
        user_id: user?.id,
        action_type: 'transcribe',
        action_details: {
          word_count: data.transcript?.wordCount,
          filler_count: data.transcript?.fillerCount,
          has_word_timing: data.transcript?.hasWordTiming,
          model: 'openai/whisper-1'
        }
      });
      
      // Set processing results
      setProcessingResults({
        wordCount: data.transcript?.wordCount || 0,
        fillerCount: data.transcript?.fillerCount || 0,
        segmentCount: data.transcript?.segmentCount || 0,
        minutesSaved: Math.round((data.transcript?.fillerCount || 0) * 0.5 / 60 * 10) / 10,
        accuracyScore: Math.round((data.transcript?.confidence || 0.95) * 100),
      });
      
      await fetchProject();
      
      toast({
        title: 'Transcription complete!',
        description: `Found ${data.transcript?.wordCount || 0} words and ${data.transcript?.fillerCount || 0} filler words.`,
      });
      
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: 'Transcription failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      
      setProject(prev => prev ? { ...prev, status: 'uploaded' } : null);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRemoveFillers = async () => {
    if (!transcript?.content) return;
    
    setIsRemovingFillers(true);
    
    try {
      const { cleaned, removedCount } = removeFillerWords(transcript.content);
      
      const { error } = await supabase
        .from('transcripts')
        .update({ 
          content: cleaned, 
          filler_words_detected: 0,
          word_count: cleaned.split(/\s+/).filter(w => w.length > 0).length
        })
        .eq('id', transcript.id);
      
      if (error) throw error;
      
      await supabase.from('ai_action_log').insert({
        project_id: project?.id,
        user_id: user?.id,
        action_type: 'remove_fillers',
        action_details: {
          fillers_removed: removedCount,
          original_word_count: transcript.word_count,
          new_word_count: cleaned.split(/\s+/).filter(w => w.length > 0).length
        }
      });
      
      setTranscript(prev => prev ? { 
        ...prev, 
        content: cleaned, 
        filler_words_detected: 0,
        word_count: cleaned.split(/\s+/).filter(w => w.length > 0).length
      } : null);
      
      setProcessingResults(prev => prev ? { ...prev, fillerCount: 0 } : null);
      
      toast({
        title: 'Fillers removed!',
        description: `Cleaned ${removedCount} filler words from your transcript.`,
      });
      
    } catch (error) {
      console.error('Error removing fillers:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove filler words',
        variant: 'destructive',
      });
    } finally {
      setIsRemovingFillers(false);
    }
  };

  const handleToolClick = (tool: ActiveTool) => {
    setActiveTool(activeTool === tool ? null : tool);
    if (activeTool !== tool) {
      setTimeout(() => {
        document.getElementById(`${tool}-section`)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No projectId - show project selection landing page
  if (!projectId) {
    return (
      <>
        <Helmet>
          <title>Refiner Studio | Alchify</title>
          <meta name="description" content="AI-powered content refinement studio for transcription, editing, clip generation, and more." />
        </Helmet>
        
        <AppLayout>
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Wand2 className="h-8 w-8 text-primary" />
                Refiner Studio
              </h1>
              <p className="text-muted-foreground mt-2">
                Your unified AI-powered editing suite. Select a project to start refining.
              </p>
            </div>
            
            {/* Project Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Your Projects
                </CardTitle>
                <CardDescription>
                  Choose a project to open in the Refiner Studio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                      <FolderOpen className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-foreground mb-2">No projects yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload content to get started with AI refinement
                    </p>
                    <Button variant="hero" onClick={() => navigate('/upload')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Content
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/refiner/${p.id}`)}
                        className="flex flex-col gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                      >
                        <div className="aspect-video rounded-md overflow-hidden bg-muted">
                          <VideoThumbnail 
                            sourceFileUrl={p.source_file_url}
                            sourceFileType={p.source_file_type}
                            className="w-full h-full"
                            showControls={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {p.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {p.source_file_type || 'video'}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(p.source_duration_seconds)}
                            </span>
                          </div>
                          {p.status === 'editing' && (
                            <Badge variant="default" className="mt-2 text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Has Transcript
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{project.title} | Refiner Studio | Alchify</title>
        <meta name="description" content="Refine your content with AI-powered transcription and editing tools." />
      </Helmet>
      
      <AppLayout>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/refiner')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{project.source_file_type}</Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(project.source_duration_seconds)}
                </span>
                {transcript && (
                  <Badge variant="default">
                    <Check className="h-3 w-3 mr-1" />
                    Transcribed
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Processing Results Banner */}
        {processingResults && transcript && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="font-medium">AI Processing Results</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-xl font-bold text-primary">{processingResults.wordCount}</div>
                    <div className="text-muted-foreground text-xs">Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-accent">{processingResults.fillerCount}</div>
                    <div className="text-muted-foreground text-xs">Fillers Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-500">{processingResults.accuracyScore}%</div>
                    <div className="text-muted-foreground text-xs">Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-500">{processingResults.minutesSaved}</div>
                    <div className="text-muted-foreground text-xs">Min Saved</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Media Preview - Takes 3 columns */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="aspect-video bg-muted/50 flex items-center justify-center">
                {mediaUrl && project.source_file_type === 'video' ? (
                  <video 
                    src={mediaUrl} 
                    controls 
                    preload="metadata"
                    className="w-full h-full object-contain bg-black"
                    onLoadedMetadata={(e) => {
                      const video = e.currentTarget;
                      video.currentTime = 0.1;
                    }}
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

            {/* Transcript Display */}
            {transcript?.content && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Transcript
                    </CardTitle>
                    {transcript.filler_words_detected !== null && transcript.filler_words_detected > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRemoveFillers}
                        disabled={isRemovingFillers}
                      >
                        {isRemovingFillers ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="mr-2 h-3 w-3" />
                        )}
                        Remove {transcript.filler_words_detected} Fillers
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {transcript.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span>{transcript.word_count} words</span>
                    {transcript.avg_confidence && (
                      <Badge variant="secondary" className="text-xs">
                        {(transcript.avg_confidence * 100).toFixed(1)}% confidence
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* AI Tools Panel - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Tools
            </h3>

            {/* Step 1: Transcription - Always show */}
            <Card className={`border-primary/30 ${transcript ? 'bg-green-500/10 border-green-500/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${transcript ? 'bg-green-500/20' : 'bg-primary/10'}`}>
                    <FileText className={`h-5 w-5 ${transcript ? 'text-green-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {transcript ? 'Transcript Ready' : 'Generate Transcript'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {transcript ? `${transcript.word_count} words transcribed` : 'Start AI processing'}
                    </p>
                  </div>
                  {transcript && (
                    <Check className="h-5 w-5 text-green-500 ml-auto" />
                  )}
                </div>
                {!transcript && (
                  <>
                    <Button 
                      variant="hero" 
                      className="w-full"
                      onClick={startTranscription}
                      disabled={isTranscribing}
                    >
                      {isTranscribing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          Generate Transcript
                        </>
                      )}
                    </Button>
                    {isTranscribing && (
                      <div className="mt-3">
                        <Progress value={45} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-center">AI is processing your content...</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Clip Generator */}
            <ToolCard
              icon={Film}
              title="AI Clip Generator"
              description="Create viral clips for TikTok, Reels, Shorts"
              isActive={activeTool === 'clips'}
              onClick={() => handleToolClick('clips')}
              disabled={!transcript}
            />

            {/* Captions */}
            <ToolCard
              icon={Captions}
              title="Captions & Subtitles"
              description="Export SRT, WebVTT, or burn-in captions"
              isActive={activeTool === 'captions'}
              onClick={() => handleToolClick('captions')}
              disabled={!transcript}
            />

            {/* Speaker Focus */}
            <ToolCard
              icon={User}
              title="Speaker Focus"
              description="AI camera framing for single-speaker content"
              isActive={activeTool === 'speaker-focus'}
              onClick={() => handleToolClick('speaker-focus')}
              disabled={!transcript}
              badge="New"
            />

            {/* Lower Thirds */}
            <ToolCard
              icon={Layers}
              title="Lower Thirds & Graphics"
              description="Add name overlays, titles, logos"
              isActive={activeTool === 'lower-thirds'}
              onClick={() => handleToolClick('lower-thirds')}
              disabled={!transcript}
              badge="New"
            />

            {/* B-Roll Suggestions */}
            <ToolCard
              icon={Image}
              title="B-Roll Suggestions"
              description="AI suggests stock footage for key moments"
              isActive={activeTool === 'b-roll'}
              onClick={() => handleToolClick('b-roll')}
              disabled={!transcript}
              badge="New"
            />

            {/* Timeline Editor */}
            <ToolCard
              icon={Play}
              title="Timeline Editor"
              description="Multi-track editing with audio/video layers"
              isActive={activeTool === 'timeline'}
              onClick={() => handleToolClick('timeline')}
              disabled={!transcript}
              badge="New"
            />
          </div>
        </div>
        
        {/* Tool Sections - Show when transcript exists and tool is active */}
        {transcript && activeTool === 'clips' && (
          <div id="clips-section" className="mt-6">
            <ClipGenerator 
              projectId={project.id} 
              transcriptContent={transcript.content}
              transcriptSegments={transcript.segments as any[] | null}
              mediaUrl={mediaUrl}
            />
          </div>
        )}
        
        {transcript && activeTool === 'captions' && (
          <div id="captions-section" className="mt-6">
            <CaptionEditor 
              transcriptContent={transcript.content}
            />
          </div>
        )}

        {transcript && activeTool === 'speaker-focus' && (
          <div id="speaker-focus-section" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Speaker Focus
                </CardTitle>
                <CardDescription>
                  AI-powered camera framing that highlights the active speaker
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm max-w-md mx-auto">
                    Speaker Focus will use AI to automatically detect and highlight the active speaker, 
                    creating dynamic camera movements for single-camera content.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {transcript && activeTool === 'lower-thirds' && (
          <div id="lower-thirds-section" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Lower Thirds & Graphics
                </CardTitle>
                <CardDescription>
                  Add professional name overlays, titles, and logos to your video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm max-w-md mx-auto">
                    Lower Thirds will let you add customizable name cards, titles, and branding 
                    graphics that appear at key moments in your video.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {transcript && activeTool === 'b-roll' && (
          <div id="b-roll-section" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5 text-primary" />
                  B-Roll Suggestions
                </CardTitle>
                <CardDescription>
                  AI analyzes your transcript and suggests relevant stock footage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm max-w-md mx-auto">
                    B-Roll Suggestions will analyze your content and recommend stock footage 
                    or images to insert at key moments to enhance your video.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {transcript && activeTool === 'timeline' && (
          <div id="timeline-section" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Timeline Editor
                </CardTitle>
                <CardDescription>
                  Multi-track editing with separate audio and video layers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Coming Soon</h3>
                  <p className="text-sm max-w-md mx-auto">
                    The Timeline Editor will provide a professional multi-track editing interface 
                    with separate audio and video layers, drag-and-drop clips, and precise trimming.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </AppLayout>
    </>
  );
};

// Tool Card Component
interface ToolCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}

const ToolCard = ({ icon: Icon, title, description, isActive, onClick, disabled, badge }: ToolCardProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left p-4 rounded-xl border transition-all ${
      isActive 
        ? 'border-primary bg-primary/10' 
        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${isActive ? 'bg-primary/20' : 'bg-muted'}`}>
        <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
            {title}
          </h4>
          {badge && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      {isActive && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
    </div>
  </button>
);

export default Refiner;
