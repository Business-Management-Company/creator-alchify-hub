import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  Loader2,
  Play,
  Pause,
  Volume2,
  Wand2,
  FileText,
  Download,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

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

const Refiner = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
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
    
    // Update project status
    await supabase
      .from('projects')
      .update({ status: 'transcribing' })
      .eq('id', project.id);
    
    setProject(prev => prev ? { ...prev, status: 'transcribing' } : null);
    
    toast({
      title: 'Transcription started',
      description: 'This may take a few minutes depending on the file length.',
    });
    
    // TODO: Call transcription edge function
    // For now, simulate completion after a delay
    setTimeout(() => {
      setIsTranscribing(false);
      toast({
        title: 'Coming soon',
        description: 'AI transcription will be available in Phase 2.',
      });
    }, 2000);
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
            <div className="aspect-video bg-muted flex items-center justify-center">
              {mediaUrl && project.source_file_type === 'video' ? (
                <video 
                  src={mediaUrl} 
                  controls 
                  className="w-full h-full object-contain"
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
          
          {/* Transcript Panel */}
          <div className="bg-card/50 border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-foreground">Transcript</h2>
              </div>
              {transcript && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{transcript.word_count || 0} words</span>
                  {transcript.filler_words_detected !== null && transcript.filler_words_detected > 0 && (
                    <Badge variant="secondary">{transcript.filler_words_detected} fillers</Badge>
                  )}
                </div>
              )}
            </div>
            
            {!transcript ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-medium text-foreground mb-2">No transcript yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Generate an AI-powered transcript to start editing and refining your content.
                </p>
                <Button 
                  variant="hero" 
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
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-background/50 rounded-lg border border-border">
                  <p className="text-foreground whitespace-pre-wrap">
                    {transcript.content || 'Transcript content will appear here...'}
                  </p>
                </div>
                
                {transcript.avg_confidence && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <Badge variant={transcript.avg_confidence > 0.9 ? 'default' : 'secondary'}>
                      {(transcript.avg_confidence * 100).toFixed(1)}%
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Refiner;
