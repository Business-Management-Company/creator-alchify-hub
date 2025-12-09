import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Upload as UploadIcon, 
  X, 
  Loader2, 
  Video, 
  Music,
  AlertCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
const ACCEPTED_TYPES = [...ACCEPTED_VIDEO_TYPES, ...ACCEPTED_AUDIO_TYPES];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

const Upload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'processing'>('uploading');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, MOV, WebM, MP3, WAV, or M4A files.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 500MB.';
    }
    return null;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError(null);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const error = validateFile(droppedFile);
      if (error) {
        setUploadError(error);
        return;
      }
      setFile(droppedFile);
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  }, [title]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const error = validateFile(selectedFile);
      if (error) {
        setUploadError(error);
        return;
      }
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadError(null);
  };

  const getFileType = (mimeType: string): 'video' | 'audio' => {
    return ACCEPTED_VIDEO_TYPES.includes(mimeType) ? 'video' : 'audio';
  };

  // Upload file with real progress tracking
  const uploadFileWithProgress = async (
    file: File, 
    filePath: string, 
    onProgress: (percent: number) => void
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Get the upload URL from Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          reject(new Error('Not authenticated'));
          return;
        }

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const uploadUrl = `${supabaseUrl}/storage/v1/object/media-uploads/${filePath}`;

        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              reject(new Error(errorData.message || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was cancelled'));
        });

        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.send(file);
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleUpload = async () => {
    if (!file || !user || !title.trim()) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    setUploadError(null);
    
    try {
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      // Upload with real progress tracking
      await uploadFileWithProgress(file, filePath, (percent) => {
        // Map 0-100 upload progress to 0-70 of total (save 30% for processing)
        setUploadProgress(Math.round(percent * 0.7));
      });
      
      setUploadProgress(70);
      setUploadStage('processing');
      
      // Create project record with 'processing' status
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          source_file_url: filePath,
          source_file_name: file.name,
          source_file_type: getFileType(file.type),
          source_file_size: file.size,
          status: 'processing',
        })
        .select()
        .single();
      
      if (projectError) {
        console.error('Project creation error:', projectError);
        throw new Error(`Failed to create project: ${projectError.message}`);
      }
      
      setUploadProgress(80);
      
      toast({
        title: 'Alchifying your content...',
        description: 'AI is transcribing, enhancing, and preparing your content.',
      });
      
      // Auto-start transcription
      try {
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: { projectId: project.id }
        });
        
        setUploadProgress(95);
        
        if (error || data?.error) {
          console.error('Auto-transcription warning:', error || data?.error);
          toast({
            title: 'Upload complete',
            description: 'Content uploaded. Transcription will continue in the background.',
          });
        } else {
          // Log AI action
          await supabase.from('ai_action_log').insert({
            project_id: project.id,
            user_id: user.id,
            action_type: 'auto_alchify',
            action_details: {
              word_count: data.transcript?.wordCount,
              filler_count: data.transcript?.fillerCount,
              auto_processed: true
            }
          });
          
          toast({
            title: 'Content Alchified! ✨',
            description: `Transcribed ${data.transcript?.wordCount || 0} words. Ready to refine!`,
          });
        }
      } catch (transcribeError) {
        console.error('Auto-transcription error:', transcribeError);
        // Continue anyway - user can manually transcribe
      }
      
      setUploadProgress(100);
      
      // Navigate to refiner
      setTimeout(() => {
        navigate(`/refiner/${project.id}`);
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Upload Content | Alchify</title>
        <meta name="description" content="Upload your raw video or audio content to Alchify for AI-powered transcription and refinement." />
      </Helmet>
      
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              className="mb-4 -ml-2"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Upload Content</h1>
            <p className="text-muted-foreground">
              Drop your raw content. Alchify will automatically transcribe, enhance, and prepare it for you.
            </p>
          </div>
          
          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
              ${isDragging 
                ? 'border-primary bg-primary/5 scale-[1.02]' 
                : 'border-border hover:border-primary/50 hover:bg-card/50'
              }
              ${file ? 'border-solid border-primary/30 bg-card/30' : ''}
            `}
          >
            {!file ? (
              <>
                <input
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={handleFileSelect}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <UploadIcon className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground mb-1">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports MP4, MOV, WebM, MP3, WAV, M4A • Max 500MB
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  {getFileType(file.type) === 'video' ? (
                    <Video className="h-8 w-8 text-primary" />
                  ) : (
                    <Music className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)} • {getFileType(file.type)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Error Message */}
          {uploadError && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}
          
          {/* Title Input */}
          {file && (
            <div className="mt-6 space-y-2">
              <Label htmlFor="title" className="text-foreground">Project Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your project"
                className="bg-background/50"
                disabled={isUploading}
              />
            </div>
          )}
          
          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  {uploadStage === 'uploading' ? (
                    <>
                      <UploadIcon className="h-4 w-4" />
                      Uploading... ({uploadProgress}%)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      Alchifying your content...
                    </>
                  )}
                </span>
                <span className="text-foreground font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {uploadStage === 'processing' && (
                <p className="text-xs text-muted-foreground text-center">
                  AI is transcribing, detecting fillers, and preparing your content
                </p>
              )}
            </div>
          )}
          
          {/* Upload Button */}
          {file && !isUploading && (
            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6"
              onClick={handleUpload}
              disabled={!title.trim()}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Alchify My Content
            </Button>
          )}
        </div>
      </AppLayout>
    </>
  );
};

export default Upload;
