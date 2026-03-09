import { useState, useCallback, useEffect, useRef } from 'react';
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
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

/* ── Accepted formats ── */
const VIDEO_MIMES = ['video/mp4', 'video/quicktime', 'video/webm'];
const AUDIO_MIMES = [
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
  'audio/flac',
];
const ALL_MIMES = [...VIDEO_MIMES, ...AUDIO_MIMES];
const ALLOWED_EXTS = ['mp4', 'mov', 'webm', 'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'];
const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

/* ── Helpers ── */
function fileExt(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function isVideo(file: File) {
  return VIDEO_MIMES.includes(file.type) || ['mp4', 'mov', 'webm'].includes(fileExt(file.name));
}

function validateFile(file: File): string | null {
  const ext = fileExt(file.name);
  if (!ALL_MIMES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
    return 'Invalid file type. Accepted: MP4, MOV, WebM, MP3, WAV, M4A, AAC, OGG, FLAC.';
  }
  if (file.size > MAX_SIZE) return 'File too large. Maximum size is 500 MB.';
  return null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Component ── */
const Upload = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');

  // Auth guard
  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  /* ── File selection ── */
  const acceptFile = useCallback(
    (f: File) => {
      setError(null);
      const err = validateFile(f);
      if (err) { setError(err); return; }
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ''));
    },
    [title],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) acceptFile(f);
    },
    [acceptFile],
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (f) acceptFile(f);
  };

  /* ── Upload with XHR for progress ── */
  const uploadToStorage = (file: File, path: string, token: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/media-uploads/${path}`;
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 70));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
      xhr.onerror = () => reject(new Error('Network error during upload'));

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.send(file);
    });

  /* ── Main handler ── */
  const handleUpload = async () => {
    if (!file || !user || !title.trim()) return;

    setUploading(true);
    setProgress(0);
    setStage('uploading');
    setError(null);

    try {
      /* 1. Auth check */
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated — please sign in again.');

      /* 2. Check first upload */
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      const firstUpload = (count ?? 0) === 0;

      /* 3. Upload file to storage */
      const ext = fileExt(file.name);
      const storagePath = `${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      await uploadToStorage(file, storagePath, session.access_token);
      setProgress(70);
      setStage('processing');

      /* 4. Create project record */
      const { data: project, error: dbErr } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          source_file_url: storagePath,
          source_file_name: file.name,
          source_file_type: isVideo(file) ? 'video' : 'audio',
          source_file_size: file.size,
          status: 'alchifying',
        })
        .select()
        .single();
      if (dbErr || !project) throw new Error(dbErr?.message ?? 'Failed to create project');
      setProgress(80);

      toast({ title: 'Alchifying your content...', description: 'AI is transcribing and preparing your content.' });

      /* 5. Trigger transcription */
      try {
        const { data, error: fnErr } = await supabase.functions.invoke('transcribe-audio', {
          body: { projectId: project.id },
        });
        setProgress(95);

        if (fnErr) {
          console.warn('Transcription warning:', fnErr);
          toast({ title: 'Upload complete', description: 'Transcription will continue in the background.' });
        } else {
          await supabase.from('ai_action_log').insert({
            project_id: project.id,
            user_id: user.id,
            action_type: 'auto_alchify',
            action_details: {
              word_count: data?.transcript?.wordCount,
              filler_count: data?.transcript?.fillerWordsDetected,
              auto_processed: true,
            },
          });
          toast({
            title: 'Content Alchified! ✨',
            description: `Transcribed ${data?.transcript?.wordCount ?? 0} words. Ready to refine!`,
          });
        }
      } catch (txErr) {
        console.error('Transcription error:', txErr);
        toast({ title: 'Upload complete', description: 'Transcription encountered an issue — you can retry later.' });
      }

      setProgress(100);
      setStage('done');

      setTimeout(() => {
        navigate(firstUpload ? '/dashboard?celebration=first-upload' : `/refiner/${project.id}`);
      }, 600);
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      toast({ title: 'Upload failed', description: msg, variant: 'destructive' });
      setProgress(0);
      setStage('idle');
      setUploading(false);
    }
  };

  /* ── Loading state ── */
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
            <Button variant="ghost" className="mb-4 -ml-2" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-foreground mb-2">Upload Content</h1>
            <p className="text-muted-foreground">
              Drop your raw content. Alchify will automatically transcribe, enhance, and prepare it for you.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
            onDrop={onDrop}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200
              ${dragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50 hover:bg-card/50'}
              ${file ? 'border-solid border-primary/30 bg-card/30' : ''}
            `}
          >
            {!file ? (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept={[
                    ...ALLOWED_EXTS.map((e) => `.${e}`),
                    ...ALL_MIMES,
                  ].join(',')}
                  onChange={onFileInput}
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
                      Supports MP4, MOV, WebM, MP3, WAV, M4A, AAC, OGG, FLAC • Max 500 MB
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  {isVideo(file) ? (
                    <Video className="h-8 w-8 text-primary" />
                  ) : (
                    <Music className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-foreground break-words">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(file.size)} • {isVideo(file) ? 'Video' : 'Audio'}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setFile(null); setError(null); }} disabled={uploading}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Title input */}
          {file && (
            <div className="mt-6 space-y-2">
              <Label htmlFor="title" className="text-foreground">Project Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your project"
                className="bg-background/50"
                disabled={uploading}
              />
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  {stage === 'uploading' && (
                    <>
                      <UploadIcon className="h-4 w-4" />
                      Uploading… ({progress}%)
                    </>
                  )}
                  {stage === 'processing' && (
                    <>
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      Alchifying your content…
                    </>
                  )}
                  {stage === 'done' && (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Done!
                    </>
                  )}
                </span>
                <span className="text-foreground font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {stage === 'processing' && (
                <p className="text-xs text-muted-foreground text-center">
                  AI is transcribing, detecting fillers, and preparing your content
                </p>
              )}
            </div>
          )}

          {/* Upload CTA */}
          {file && !uploading && (
            <Button
              variant="hero"
              size="lg"
              className="w-full mt-6 h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleUpload}
              disabled={!title.trim()}
            >
              <Sparkles className="mr-2 h-6 w-6" />
              Alchify My Content
            </Button>
          )}
        </div>
      </AppLayout>
    </>
  );
};

export default Upload;
