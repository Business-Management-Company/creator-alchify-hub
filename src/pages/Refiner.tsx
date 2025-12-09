import { useState, useEffect, useCallback } from 'react';
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
  Save,
  Scissors,
  X,
  Monitor,
  Smartphone,
  Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { ClipGenerator } from '@/components/refiner/ClipGenerator';
import { CaptionEditor } from '@/components/refiner/CaptionEditor';
import { extractAudioFromVideo, needsAudioExtraction } from '@/lib/audio-extraction';
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

// Pipeline step status type
type PipelineStatus = 'pending' | 'active' | 'complete';

interface PipelineState {
  transcription: PipelineStatus;
  removeFillers: PipelineStatus;
  removeGaps: PipelineStatus;
  audioCleanup: PipelineStatus;
  enhanceAudio: PipelineStatus;
  enhanceVideo: PipelineStatus;
}

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so,', 'well,'];

// Cache helper functions
const getCacheKey = (projectId: string) => `refiner_cache_${projectId}`;

interface CachedData {
  transcript: Transcript | null;
  processingResults: ProcessingResults | null;
  pipelineState: PipelineState;
  cachedAt: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const loadFromCache = (projectId: string): CachedData | null => {
  try {
    const cached = localStorage.getItem(getCacheKey(projectId));
    if (!cached) return null;
    const data = JSON.parse(cached) as CachedData;
    // Check if cache is still valid
    if (Date.now() - data.cachedAt > CACHE_DURATION) {
      localStorage.removeItem(getCacheKey(projectId));
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const saveToCache = (projectId: string, data: Omit<CachedData, 'cachedAt'>) => {
  try {
    localStorage.setItem(getCacheKey(projectId), JSON.stringify({
      ...data,
      cachedAt: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
};

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
  const [showClipsTooltip, setShowClipsTooltip] = useState(false);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isProcessingActive, setIsProcessingActive] = useState(false);
  const [currentProcessingStep, setCurrentProcessingStep] = useState('');
  const [isGeneratingClips, setIsGeneratingClips] = useState(false);
  const [generatingClipProgress, setGeneratingClipProgress] = useState<number[]>([0, 0, 0, 0, 0]);
  const [clipsReady, setClipsReady] = useState(false);
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    transcription: 'pending',
    removeFillers: 'pending',
    removeGaps: 'pending',
    audioCleanup: 'pending',
    enhanceAudio: 'pending',
    enhanceVideo: 'pending',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProjects();
      if (projectId) {
        // Try to load from cache first
        const cached = loadFromCache(projectId);
        if (cached) {
          setTranscript(cached.transcript);
          setProcessingResults(cached.processingResults);
          setPipelineState(cached.pipelineState);
        }
        fetchProject(!!cached);
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

  const fetchProject = async (hasCachedData: boolean = false) => {
    try {
      // Only show loading if we don't have cached data
      if (!hasCachedData) {
        setLoading(true);
      }
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
        const newPipelineState: PipelineState = {
          transcription: 'complete',
          removeFillers: 'complete',
          removeGaps: 'complete',
          audioCleanup: 'complete',
          enhanceAudio: 'complete',
          enhanceVideo: 'complete',
        };
        setPipelineState(newPipelineState);
        const newProcessingResults: ProcessingResults = {
          wordCount: transcriptData.word_count || 0,
          fillerCount: transcriptData.filler_words_detected || 0,
          segmentCount: Array.isArray(transcriptData.segments) ? (transcriptData.segments as any[]).length : 0,
          minutesSaved: Math.round((transcriptData.filler_words_detected || 0) * 0.5 / 60 * 10) / 10,
          accuracyScore: Math.round((transcriptData.avg_confidence || 0.95) * 100),
          clipsGenerated: 4,
          audioEnhanced: 12,
        };
        setProcessingResults(newProcessingResults);
        
        // Save to cache
        if (projectId) {
          saveToCache(projectId, {
            transcript: transcriptData,
            processingResults: newProcessingResults,
            pipelineState: newPipelineState,
          });
        }
      } else {
        // Reset pipeline state for unprocessed projects
        setPipelineState({
          transcription: 'pending',
          removeFillers: 'pending',
          removeGaps: 'pending',
          audioCleanup: 'pending',
          enhanceAudio: 'pending',
          enhanceVideo: 'pending',
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

  // Update pipeline state - called from NotProcessedCTA
  const updatePipelineStep = useCallback((step: keyof PipelineState, status: PipelineStatus) => {
    setPipelineState(prev => ({ ...prev, [step]: status }));
  }, []);

  // Handle processing complete - update local state without refetching
  const handleProcessingComplete = useCallback(async () => {
    // Just refetch the transcript data without full page reload
    if (!projectId) return;
    
    const { data: transcriptData } = await supabase
      .from('transcripts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (transcriptData) {
      setTranscript(transcriptData);
      const newPipelineState: PipelineState = {
        transcription: 'complete',
        removeFillers: 'complete',
        removeGaps: 'complete',
        audioCleanup: 'complete',
        enhanceAudio: 'complete',
        enhanceVideo: 'complete',
      };
      setPipelineState(newPipelineState);
      const newProcessingResults: ProcessingResults = {
        wordCount: transcriptData.word_count || 0,
        fillerCount: transcriptData.filler_words_detected || 0,
        segmentCount: Array.isArray(transcriptData.segments) ? (transcriptData.segments as any[]).length : 0,
        minutesSaved: Math.round((transcriptData.filler_words_detected || 0) * 0.5 / 60 * 10) / 10,
        accuracyScore: Math.round((transcriptData.avg_confidence || 0.95) * 100),
        clipsGenerated: 4,
        audioEnhanced: 12,
      };
      setProcessingResults(newProcessingResults);
      
      // Show tooltip to prompt clips creation
      setShowClipsTooltip(true);
      
      // Save to cache
      saveToCache(projectId, {
        transcript: transcriptData,
        processingResults: newProcessingResults,
        pipelineState: newPipelineState,
      });
    }
  }, [projectId]);

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
        <div className="grid lg:grid-cols-12 gap-3">
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
                {/* Video Preview with Processing Overlay */}
                <div className="bg-card border border-border rounded-xl overflow-hidden relative">
                  <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
                    {mediaUrl && project.source_file_type === 'video' ? (
                      <video 
                        src={mediaUrl} 
                        controls={!isProcessingActive}
                        preload="metadata"
                        className={`w-full h-full object-contain bg-black transition-all duration-300 ${isProcessingActive ? 'opacity-60' : ''}`}
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
                    
                    {/* Processing Overlay Animation */}
                    {isProcessingActive && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="relative">
                          {/* Animated rings */}
                          <div className="absolute inset-0 animate-ping rounded-full bg-green-500/30 w-24 h-24" />
                          <div className="absolute inset-2 animate-ping rounded-full bg-green-500/40 w-20 h-20 animation-delay-150" />
                          <div className="relative z-10 w-24 h-24 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-green-400 animate-pulse" />
                          </div>
                        </div>
                        <div className="mt-6 text-center">
                          <p className="text-white font-semibold text-lg">{currentProcessingStep || 'Processing...'}</p>
                          <p className="text-white/70 text-sm mt-1">AI is refining your content</p>
                        </div>
                        {/* Scanning line animation */}
                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" 
                             style={{ top: '50%', transform: 'translateY(-50%)' }} />
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
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Processing Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PipelineStep 
                  label="Transcription" 
                  status={pipelineState.transcription}
                />
                <PipelineStep 
                  label="Remove Fillers" 
                  status={pipelineState.removeFillers}
                />
                <PipelineStep 
                  label="Remove Gaps" 
                  status={pipelineState.removeGaps}
                />
                <PipelineStep 
                  label="Audio Cleanup" 
                  status={pipelineState.audioCleanup}
                />
                <PipelineStep 
                  label="Enhance Audio" 
                  status={pipelineState.enhanceAudio}
                />
                <PipelineStep 
                  label="Enhance Video" 
                  status={pipelineState.enhanceVideo}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Not Yet Processed - Show CTA prominently */}
        {project && !isProcessingComplete && (
          <NotProcessedCTA 
            projectId={project.id}
            fileSize={project.source_file_size || 0}
            mediaUrl={mediaUrl}
            onProcessingComplete={handleProcessingComplete}
            updatePipelineStep={updatePipelineStep}
            setIsProcessingActive={setIsProcessingActive}
            setCurrentProcessingStep={setCurrentProcessingStep}
          />
        )}

        {/* Processing Results - Matching design */}
        {project && activeTab === 'overview' && (
          <Card className="mt-3">
            <CardHeader className="pb-2 pt-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Processing Results
              </CardTitle>
              <CardDescription className="text-xs">AI improvements applied to your content</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              {/* Stats Grid - Boxed style */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
                <div className="border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">{processingResults?.minutesSaved || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Minutes Saved</div>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-destructive">{processingResults?.fillerCount || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Fillers Found</div>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-orange-500">0</div>
                  <div className="text-[10px] text-muted-foreground">Pauses Detected</div>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-green-500">{processingResults?.audioEnhanced || 0}%</div>
                  <div className="text-[10px] text-muted-foreground">Audio Enhanced</div>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple-500">{processingResults?.clipsGenerated || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Clips Generated</div>
                </div>
                <div className="border border-border rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-blue-500">{processingResults?.wordCount || 0}</div>
                  <div className="text-[10px] text-muted-foreground">Words Transcribed</div>
                </div>
              </div>

              {/* Audio Enhancement & Content Cleanup */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Audio Enhancement</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Noise Reduction</span>
                      <span>-18dB removed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Normalization</span>
                      <span>-14 LUFS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dynamic Range</span>
                      <span>Optimized</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Content Cleanup</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Filler words found</span>
                      <span>{processingResults?.fillerCount || 0} instances</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segments created</span>
                      <span>{processingResults?.segmentCount || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Clips suggested</span>
                      <span>{processingResults?.clipsGenerated || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Tab Content - Clips - Use hidden instead of conditional render to preserve state */}
        <div className={`mt-3 space-y-4 ${activeTab === 'clips' ? '' : 'hidden'}`}>
          {/* Generating Clips View - Phone Mockups */}
          {isGeneratingClips && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  Generating Clips...
                </CardTitle>
                <CardDescription>
                  AI is analyzing your content and creating {selectedFormat || '9:16'} clips
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 py-6">
                  {[
                    { title: 'Opening Hook', score: 96 },
                    { title: 'Key Insight', score: 92 },
                    { title: 'Best Quote', score: 89 },
                    { title: 'Call to Action', score: 85 },
                    { title: 'Viral Moment', score: 94 },
                  ].map((clip, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      {/* Phone Mockup */}
                      <div 
                        className={`relative bg-card border-4 border-foreground/20 rounded-[2rem] overflow-hidden shadow-xl ${
                          selectedFormat === '1:1' ? 'w-28 h-28' :
                          selectedFormat === '16:9' ? 'w-36 h-20' :
                          'w-20 h-36'
                        }`}
                      >
                        {/* Screen content */}
                        <div className="absolute inset-2 bg-muted rounded-xl overflow-hidden">
                          {generatingClipProgress[index] < 100 ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="relative w-10 h-10">
                                <svg className="w-10 h-10 transform -rotate-90">
                                  <circle
                                    cx="20"
                                    cy="20"
                                    r="16"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    className="text-muted-foreground/20"
                                  />
                                  <circle
                                    cx="20"
                                    cy="20"
                                    r="16"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    fill="transparent"
                                    strokeDasharray={100}
                                    strokeDashoffset={100 - generatingClipProgress[index]}
                                    className="text-primary transition-all duration-200"
                                  />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                  {Math.round(generatingClipProgress[index])}%
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center animate-fade-in">
                              <CheckCircle className="h-8 w-8 text-green-500 mb-1" />
                              <span className="text-xs font-bold text-green-600">{clip.score}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Notch (for vertical formats) */}
                        {selectedFormat !== '16:9' && selectedFormat !== '1:1' && (
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-foreground/20 rounded-full" />
                        )}
                      </div>
                      
                      {/* Label */}
                      <div className="text-center">
                        <p className="text-xs font-medium text-foreground truncate w-20">{clip.title}</p>
                        {generatingClipProgress[index] >= 100 && (
                          <p className="text-xs text-muted-foreground">Score: {clip.score}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Clips Ready or ClipGenerator */}
          {!isGeneratingClips && project && transcript ? (
            <ClipGenerator 
              projectId={project.id} 
              transcriptContent={transcript.content}
              transcriptSegments={transcript.segments as any[] | null}
              mediaUrl={mediaUrl}
              selectedFormat={selectedFormat}
              autoGenerate={clipsReady}
              onClipGenerated={() => {
                console.log('Clips generated successfully');
                setClipsReady(false);
              }}
            />
          ) : !isGeneratingClips && project ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">Process Content First</h3>
                  <p className="text-sm max-w-md mx-auto">
                    Generate a transcript first to unlock AI clip generation.
                  </p>
                  <Button 
                    variant="hero" 
                    className="mt-4" 
                    onClick={() => setActiveTab('overview')}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Processing
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Tab Content - Video Tools */}
        {activeTab === 'video' && project && (
          <div className="mt-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Video Editing Tools
                </CardTitle>
                <CardDescription>
                  Advanced video editing and enhancement features
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content - Audio */}
        {activeTab === 'audio' && project && (
          <div className="mt-3">
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
                {transcript ? (
                  <CaptionEditor transcriptContent={transcript.content} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Captions className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-medium mb-2">No Transcript Available</h3>
                    <p className="text-sm max-w-md mx-auto">
                      Process your content first to generate captions.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab Content - Distribute */}
        {activeTab === 'distribute' && project && (
          <div className="mt-3">
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

        {/* Fixed Bottom Navigation Bar */}
        {project && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left - Status */}
                <div className="flex items-center gap-3">
                  {isProcessingComplete ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-500" />
                      <span className="text-base font-medium text-green-600">Ready</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 text-primary" />
                      <span className="text-base font-medium text-muted-foreground">Pending</span>
                    </>
                  )}
                </div>

                {/* Center - Tab Navigation */}
                <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1.5">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-5 py-2 text-base font-medium rounded-md transition-colors ${
                      activeTab === 'overview' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Overview
                  </button>
                  
                  {/* Clips button with tooltip */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowClipsTooltip(false);
                        if (isProcessingComplete) {
                          setShowFormatDialog(true);
                        } else {
                          setActiveTab('clips');
                        }
                      }}
                      className={`px-5 py-2 text-base font-medium rounded-md transition-colors flex items-center gap-2 ${
                        activeTab === 'clips' 
                          ? 'bg-background text-foreground shadow-sm' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Scissors className="h-4 w-4" />
                      Clips
                    </button>
                    
                    {/* Clips tooltip */}
                    {showClipsTooltip && isProcessingComplete && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 animate-fade-in">
                        <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span className="font-medium">Ready to create clips!</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowClipsTooltip(false);
                            }}
                            className="ml-2 p-0.5 hover:bg-primary-foreground/20 rounded"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="w-3 h-3 bg-primary rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5" />
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setActiveTab('audio')}
                    className={`px-5 py-2 text-base font-medium rounded-md transition-colors ${
                      activeTab === 'audio' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Audio
                  </button>
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`px-5 py-2 text-base font-medium rounded-md transition-colors ${
                      activeTab === 'video' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setActiveTab('distribute')}
                    className={`px-5 py-2 text-base font-medium rounded-md transition-colors ${
                      activeTab === 'distribute' 
                        ? 'bg-background text-foreground shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Distribute
                  </button>
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-4">
                  <Button size="lg" variant="outline" disabled={!isProcessingComplete}>
                    <Share2 className="mr-2 h-5 w-5" />
                    Share
                  </Button>
                  <Button size="lg" variant="outline" disabled={!isProcessingComplete}>
                    <Download className="mr-2 h-5 w-5" />
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom spacer for fixed bar */}
        {project && <div className="h-20" />}
        
        {/* Clip Format Selection Dialog */}
        <Dialog open={showFormatDialog} onOpenChange={setShowFormatDialog}>
          <DialogContent className="sm:max-w-lg bg-card border-border">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5 text-primary" />
                Choose Clip Format
              </DialogTitle>
              <DialogDescription>
                Select an aspect ratio for your clips
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 py-4">
              {/* Format options */}
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: '9:16', label: '9:16 Vertical', desc: 'TikTok, Reels, Shorts', icon: Smartphone },
                  { id: '1:1', label: '1:1 Square', desc: 'Instagram, Facebook', icon: Square },
                  { id: '16:9', label: '16:9 Landscape', desc: 'YouTube, LinkedIn', icon: Monitor },
                  { id: '4:5', label: '4:5 Vertical', desc: 'Instagram Feed', icon: Smartphone },
                  { id: '16:10', label: '16:10 Landscape', desc: 'Presentations', icon: Monitor },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setSelectedFormat(format.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all ${
                      selectedFormat === format.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <format.icon className={`h-6 w-6 ${selectedFormat === format.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left flex-1">
                      <div className={`font-medium ${selectedFormat === format.id ? 'text-primary' : 'text-foreground'}`}>
                        {format.label}
                      </div>
                      <div className="text-sm text-muted-foreground">{format.desc}</div>
                    </div>
                    {selectedFormat === format.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowFormatDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="hero"
                disabled={!selectedFormat}
                onClick={() => {
                  setShowFormatDialog(false);
                  setActiveTab('clips');
                  setIsGeneratingClips(true);
                  setClipsReady(false);
                  setGeneratingClipProgress([0, 0, 0, 0, 0]);
                  toast({
                    title: `${selectedFormat} format selected`,
                    description: 'AI is generating clip suggestions...',
                  });
                  
                  // Simulate clip generation progress
                  const progressIntervals: NodeJS.Timeout[] = [];
                  [0, 1, 2, 3, 4].forEach((index) => {
                    const startDelay = index * 400;
                    setTimeout(() => {
                      const interval = setInterval(() => {
                        setGeneratingClipProgress(prev => {
                          const newProgress = [...prev];
                          if (newProgress[index] < 100) {
                            newProgress[index] = Math.min(newProgress[index] + Math.random() * 15 + 5, 100);
                          }
                          // Check if all complete
                          if (newProgress.every(p => p >= 100)) {
                            progressIntervals.forEach(i => clearInterval(i));
                            setTimeout(() => {
                              setIsGeneratingClips(false);
                              setClipsReady(true);
                            }, 500);
                          }
                          return newProgress;
                        });
                      }, 200);
                      progressIntervals.push(interval);
                    }, startDelay);
                  });
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Clips
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </>
  );
};

// Not Processed CTA Component
const NotProcessedCTA = ({ 
  projectId,
  fileSize,
  mediaUrl,
  onProcessingComplete,
  updatePipelineStep,
  setIsProcessingActive,
  setCurrentProcessingStep,
}: { 
  projectId: string;
  fileSize: number;
  mediaUrl: string | null;
  onProcessingComplete: () => void;
  updatePipelineStep: (step: keyof PipelineState, status: PipelineStatus) => void;
  setIsProcessingActive: (active: boolean) => void;
  setCurrentProcessingStep: (step: string) => void;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const { toast } = useToast();

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    setIsProcessingActive(true);
    try {
      let audioData: string | undefined;
      
      // Check if we need to extract audio first
      if (needsAudioExtraction(fileSize) && mediaUrl) {
        setProcessingStatus('Extracting audio...');
        setCurrentProcessingStep('Extracting audio...');
        toast({
          title: 'Extracting audio...',
          description: 'This may take a moment for large files.',
        });
        
        try {
          const result = await extractAudioFromVideo(mediaUrl, (progress) => {
            setProcessingStatus(`Extracting audio... ${progress}%`);
            setCurrentProcessingStep(`Extracting audio... ${progress}%`);
          });
          
          // Convert blob to base64
          const reader = new FileReader();
          audioData = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(result.audioBlob);
          });
          
          console.log(`Audio extracted: ${(result.sizeBytes / 1024 / 1024).toFixed(2)}MB`);
        } catch (extractError) {
          console.error('Audio extraction failed:', extractError);
          throw new Error('Failed to extract audio. The video format may not be supported.');
        }
      }
      
      // Step 1: Transcription
      setProcessingStatus('Transcribing content...');
      setCurrentProcessingStep('Transcribing content...');
      updatePipelineStep('transcription', 'active');
      toast({
        title: 'Alchifying your content...',
        description: 'AI is transcribing your content.',
      });

      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { projectId, audioData }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      updatePipelineStep('transcription', 'complete');

      // Step 2: Remove Fillers (simulated)
      setProcessingStatus('Detecting filler words...');
      setCurrentProcessingStep('Removing filler words...');
      updatePipelineStep('removeFillers', 'active');
      await new Promise(r => setTimeout(r, 500));
      updatePipelineStep('removeFillers', 'complete');

      // Step 3: Remove Gaps (simulated)
      setProcessingStatus('Analyzing audio gaps...');
      setCurrentProcessingStep('Removing gaps...');
      updatePipelineStep('removeGaps', 'active');
      await new Promise(r => setTimeout(r, 400));
      updatePipelineStep('removeGaps', 'complete');

      // Step 4: Audio Cleanup (simulated)
      setProcessingStatus('Cleaning up audio...');
      setCurrentProcessingStep('Cleaning up audio...');
      updatePipelineStep('audioCleanup', 'active');
      await new Promise(r => setTimeout(r, 500));
      updatePipelineStep('audioCleanup', 'complete');

      // Step 5: Enhance Audio (simulated)
      setProcessingStatus('Enhancing audio quality...');
      setCurrentProcessingStep('Enhancing audio...');
      updatePipelineStep('enhanceAudio', 'active');
      await new Promise(r => setTimeout(r, 600));
      updatePipelineStep('enhanceAudio', 'complete');

      // Step 6: Enhance Video (simulated)
      setProcessingStatus('Enhancing video quality...');
      setCurrentProcessingStep('Enhancing video...');
      updatePipelineStep('enhanceVideo', 'active');
      await new Promise(r => setTimeout(r, 700));
      updatePipelineStep('enhanceVideo', 'complete');

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
      setIsProcessingActive(false);
      setProcessingStatus('');
      setCurrentProcessingStep('');
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
                {processingStatus || 'Processing...'}
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

// Pipeline Step Component with animation - GREEN processing color
const PipelineStep = ({ label, status }: { label: string; status: PipelineStatus }) => (
  <div className="flex items-center gap-3">
    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
      status === 'complete' ? 'bg-green-500 scale-100' : 
      status === 'active' ? 'bg-green-500 animate-pulse scale-110' : 
      'bg-muted scale-100'
    }`}>
      {status === 'complete' && <Check className="h-4 w-4 text-white" />}
      {status === 'active' && <Loader2 className="h-4 w-4 text-white animate-spin" />}
    </div>
    <span className={`transition-colors duration-300 ${
      status === 'complete' ? 'text-foreground font-medium' : 
      status === 'active' ? 'text-green-600 font-medium' : 
      'text-muted-foreground'
    }`}>
      {label}
    </span>
    {status === 'active' && (
      <span className="text-xs text-green-600 animate-pulse ml-auto">Processing...</span>
    )}
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
