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
  Captions
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { ClipGenerator } from '@/components/refiner/ClipGenerator';
import { CaptionEditor } from '@/components/refiner/CaptionEditor';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  source_file_url: string | null;
  source_file_name: string | null;
  source_file_type: string | null;
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
  
  // Clean up extra spaces and commas
  cleaned = cleaned.replace(/\s+/g, ' ').replace(/\s*,\s*,/g, ',').trim();
  
  return { cleaned, removedCount };
};

// Component to highlight filler words in transcript
const TranscriptContent = ({ content }: { content: string }) => {
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
  
  // Create regex pattern for filler words
  const pattern = new RegExp(`\\b(${fillerWords.join('|')})\\b`, 'gi');
  
  // Split content and highlight filler words
  const parts = content.split(pattern);
  
  return (
    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
      {parts.map((part, index) => {
        const isFillerWord = fillerWords.some(
          filler => part.toLowerCase() === filler.toLowerCase()
        );
        
        if (isFillerWord) {
          return (
            <span 
              key={index} 
              className="bg-accent/20 text-accent px-1 rounded cursor-pointer hover:bg-accent/30 transition-colors"
              title="Filler word - click to remove"
            >
              {part}
            </span>
          );
        }
        
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
};

const Refiner = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRemovingFillers, setIsRemovingFillers] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && projectId) {
      fetchProject();
    }
  }, [user, projectId]);

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
      
      // Fetch transcript if exists
      const { data: transcriptData } = await supabase
        .from('transcripts')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      
      if (transcriptData) {
        setTranscript(transcriptData);
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
      // Update project status locally
      setProject(prev => prev ? { ...prev, status: 'transcribing' } : null);
      
      toast({
        title: 'Transcription started',
        description: 'AI is processing your content. This may take a moment.',
      });
      
      // Call the transcription edge function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { projectId: project.id }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }
      
      // Log AI action for authenticity tracking
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
      
      // Refresh the project and transcript data
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
      
      // Reset project status
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
      
      // Update transcript in database
      const { error } = await supabase
        .from('transcripts')
        .update({ 
          content: cleaned, 
          filler_words_detected: 0,
          word_count: cleaned.split(/\s+/).filter(w => w.length > 0).length
        })
        .eq('id', transcript.id);
      
      if (error) throw error;
      
      // Log AI action for authenticity tracking
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
      
      // Update local state
      setTranscript(prev => prev ? { 
        ...prev, 
        content: cleaned, 
        filler_words_detected: 0,
        word_count: cleaned.split(/\s+/).filter(w => w.length > 0).length
      } : null);
      
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/projects')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{project.title}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{project.source_file_type}</Badge>
                <Badge variant={project.status === 'transcribing' ? 'default' : 'outline'}>
                  {project.status}
                </Badge>
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
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Media Preview */}
          <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
            <div className="aspect-video bg-muted/50 flex items-center justify-center">
              {mediaUrl && project.source_file_type === 'video' ? (
                <video 
                  src={mediaUrl} 
                  controls 
                  preload="metadata"
                  className="w-full h-full object-contain bg-black"
                  onLoadedMetadata={(e) => {
                    // Seek to 0.1s to show first frame as thumbnail
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
          
          {/* AI Tools Panel */}
          <div className="space-y-4">
            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Generate Transcript Card */}
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Transcript</h3>
                    {transcript ? (
                      <p className="text-sm text-muted-foreground">{transcript.word_count || 0} words</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">AI-powered speech to text</p>
                    )}
                  </div>
                  {transcript && transcript.filler_words_detected !== null && transcript.filler_words_detected > 0 && (
                    <Badge variant="secondary" className="ml-auto">{transcript.filler_words_detected} fillers</Badge>
                  )}
                </div>
                
                {!transcript ? (
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
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-background/50 rounded-lg border border-border max-h-32 overflow-y-auto">
                      <p className="text-sm text-foreground line-clamp-4">{transcript.content}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {transcript.avg_confidence && (
                        <Badge variant={transcript.avg_confidence > 0.9 ? 'default' : 'secondary'}>
                          {(transcript.avg_confidence * 100).toFixed(1)}% confidence
                        </Badge>
                      )}
                      {transcript.filler_words_detected !== null && transcript.filler_words_detected > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-auto text-accent border-accent/30"
                          onClick={handleRemoveFillers}
                          disabled={isRemovingFillers}
                        >
                          {isRemovingFillers ? (
                            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="mr-2 h-3 w-3" />
                          )}
                          Remove Fillers
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* AI Post Production Card */}
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Post Production</h3>
                    <p className="text-sm text-muted-foreground">Audio cleanup, filler removal, noise reduction</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/post-production')}
                  disabled={!transcript}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {transcript ? 'Open Post Production' : 'Generate Transcript First'}
                </Button>
              </div>
              
              {/* AI Clip Generator Card */}
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">AI Clip Generator</h3>
                    <p className="text-sm text-muted-foreground">Create viral clips for TikTok, Reels, Shorts</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!transcript}
                >
                  <Film className="mr-2 h-4 w-4" />
                  {transcript ? 'Generate Clips' : 'Generate Transcript First'}
                </Button>
              </div>
              
              {/* Captions Card */}
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-secondary/30">
                    <Captions className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Captions & Subtitles</h3>
                    <p className="text-sm text-muted-foreground">Export SRT, WebVTT, or burn-in captions</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!transcript}
                >
                  <Captions className="mr-2 h-4 w-4" />
                  {transcript ? 'Edit Captions' : 'Generate Transcript First'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tools Section - Show when transcript exists */}
        {transcript && (
          <div className="grid lg:grid-cols-2 gap-6">
            <ClipGenerator 
              projectId={project.id} 
              transcriptContent={transcript.content}
              transcriptSegments={transcript.segments as any[] | null}
              mediaUrl={mediaUrl}
            />
            <CaptionEditor 
              transcriptContent={transcript.content}
            />
          </div>
        )}
      </AppLayout>
    </>
  );
};

export default Refiner;
