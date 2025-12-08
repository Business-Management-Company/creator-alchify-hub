import { useState } from 'react';
import { 
  Scissors, 
  Loader2, 
  Sparkles, 
  Download, 
  Clock, 
  TrendingUp, 
  Video, 
  CheckCircle, 
  AlertCircle,
  Type,
  Play,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Clip {
  title: string;
  startTime: string;
  endTime: string;
  hook: string;
  platforms: string[];
  score: number;
  renderId?: string;
  renderStatus?: 'idle' | 'rendering' | 'done' | 'failed';
  renderUrl?: string;
}

interface CaptionStyle {
  font: string;
  color: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  size: 'small' | 'medium' | 'large';
  animation: 'fade' | 'slide' | 'pop' | 'karaoke';
}

interface ClipGeneratorProps {
  projectId: string;
  transcriptContent: string | null;
  mediaUrl?: string | null;
  onClipGenerated?: () => void;
}

const platformColors: Record<string, string> = {
  tiktok: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  reels: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  shorts: 'bg-red-500/20 text-red-400 border-red-500/30',
  linkedin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const CAPTION_COLORS = [
  { value: '#FFFFFF', label: 'White' },
  { value: '#FFFF00', label: 'Yellow' },
  { value: '#00FF00', label: 'Green' },
  { value: '#FF69B4', label: 'Pink' },
  { value: '#00FFFF', label: 'Cyan' },
];

function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

// Parse transcript to get caption segments for a specific time range
function extractCaptionsForClip(
  transcriptContent: string, 
  startTime: number, 
  endTime: number
): { start: number; end: number; text: string }[] {
  const regex = /\[(\d{2}:\d{2})\]\s*([^\[]+)/g;
  const segments: { start: number; end: number; text: string }[] = [];
  let match;
  const allMatches: { time: number; text: string }[] = [];

  while ((match = regex.exec(transcriptContent)) !== null) {
    const time = timeToSeconds(match[1]);
    const text = match[2].trim();
    allMatches.push({ time, text });
  }

  // Create segments with proper start/end times
  for (let i = 0; i < allMatches.length; i++) {
    const current = allMatches[i];
    const next = allMatches[i + 1];
    
    const segmentStart = current.time;
    const segmentEnd = next ? next.time : current.time + 5;

    // Only include segments that overlap with clip range
    if (segmentEnd >= startTime && segmentStart <= endTime) {
      segments.push({
        start: Math.max(segmentStart, startTime),
        end: Math.min(segmentEnd, endTime),
        text: current.text,
      });
    }
  }

  return segments;
}

export function ClipGenerator({ projectId, transcriptContent, mediaUrl, onClipGenerated }: ClipGeneratorProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [renderingClips, setRenderingClips] = useState<Set<number>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [captionStyle, setCaptionStyle] = useState<CaptionStyle>({
    font: 'Montserrat ExtraBold',
    color: '#FFFFFF',
    backgroundColor: '#000000CC',
    position: 'bottom',
    size: 'medium',
    animation: 'pop',
  });
  const { toast } = useToast();

  const generateClips = async () => {
    if (!transcriptContent) {
      toast({
        title: 'No transcript',
        description: 'Generate a transcript first before creating clips.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-clips', {
        body: { projectId, transcriptContent }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const clipsWithStatus = (data.clips || []).map((clip: Clip) => ({
        ...clip,
        renderStatus: 'idle' as const,
      }));
      
      setClips(clipsWithStatus);

      toast({
        title: 'Clips generated!',
        description: `Found ${data.clips?.length || 0} potential clips from your content.`,
      });

      onClipGenerated?.();
    } catch (error) {
      console.error('Clip generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderClip = async (index: number, platform: string) => {
    const clip = clips[index];
    
    if (!mediaUrl) {
      toast({
        title: 'No media',
        description: 'Media file is required to render clips.',
        variant: 'destructive',
      });
      return;
    }

    setRenderingClips(prev => new Set(prev).add(index));
    
    setClips(prev => prev.map((c, i) => 
      i === index ? { ...c, renderStatus: 'rendering' as const } : c
    ));

    try {
      const startTime = timeToSeconds(clip.startTime);
      const endTime = timeToSeconds(clip.endTime);

      // Extract captions for this clip's time range
      const captions = transcriptContent 
        ? extractCaptionsForClip(transcriptContent, startTime, endTime)
        : [];

      const { data, error } = await supabase.functions.invoke('render-clip', {
        body: {
          action: 'render',
          videoUrl: mediaUrl,
          startTime,
          endTime,
          title: clip.title,
          platform: platform as 'tiktok' | 'reels' | 'shorts',
          captions,
          captionStyle,
        }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setClips(prev => prev.map((c, i) => 
        i === index ? { ...c, renderId: data.renderId } : c
      ));

      toast({
        title: 'Render started!',
        description: `Your ${platform} clip with animated captions is being created.`,
      });

      pollRenderStatus(index, data.renderId);

    } catch (error) {
      console.error('Render error:', error);
      setClips(prev => prev.map((c, i) => 
        i === index ? { ...c, renderStatus: 'failed' as const } : c
      ));
      toast({
        title: 'Render failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setRenderingClips(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const pollRenderStatus = async (index: number, renderId: string) => {
    const maxAttempts = 60;
    let attempts = 0;

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('render-clip', {
          body: { action: 'status', renderId }
        });

        if (error || data?.error) {
          throw new Error(error?.message || data?.error);
        }

        if (data.status === 'done' && data.url) {
          setClips(prev => prev.map((c, i) => 
            i === index ? { ...c, renderStatus: 'done' as const, renderUrl: data.url } : c
          ));
          toast({
            title: 'Clip ready!',
            description: 'Your video clip with captions is ready to download.',
          });
          return;
        }

        if (data.status === 'failed') {
          setClips(prev => prev.map((c, i) => 
            i === index ? { ...c, renderStatus: 'failed' as const } : c
          ));
          toast({
            title: 'Render failed',
            description: 'The video render failed. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    setTimeout(checkStatus, 5000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  const getStatusIcon = (status?: Clip['renderStatus']) => {
    switch (status) {
      case 'rendering':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  if (clips.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scissors className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">AI Clip Generator</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Generate Viral Clips</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            AI analyzes your transcript and creates clips with animated captions for TikTok, Reels & Shorts.
          </p>
          <Button
            variant="hero"
            onClick={generateClips}
            disabled={isGenerating || !transcriptContent}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Clips
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 border border-border rounded-xl p-6">
      {/* Video Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative bg-card rounded-xl p-4 max-w-md w-full mx-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setPreviewUrl(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            <h3 className="font-semibold text-foreground mb-3">Clip Preview</h3>
            <video
              src={previewUrl}
              controls
              autoPlay
              className="w-full rounded-lg aspect-[9/16] max-h-[70vh] object-contain bg-black"
            />
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Note: Shotstack watermark appears on free tier renders
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">AI Clips</h2>
          <Badge variant="secondary">{clips.length} clips</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Caption Style Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Type className="mr-1 h-3 w-3" />
                Caption Style
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Animation</label>
                  <Select 
                    value={captionStyle.animation} 
                    onValueChange={(v: CaptionStyle['animation']) => 
                      setCaptionStyle(s => ({ ...s, animation: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pop">Pop (Zoom In)</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide Up</SelectItem>
                      <SelectItem value="karaoke">Karaoke</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Color</label>
                  <Select 
                    value={captionStyle.color} 
                    onValueChange={(v) => setCaptionStyle(s => ({ ...s, color: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAPTION_COLORS.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-border" 
                              style={{ backgroundColor: c.value }} 
                            />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Size</label>
                  <Select 
                    value={captionStyle.size} 
                    onValueChange={(v: CaptionStyle['size']) => 
                      setCaptionStyle(s => ({ ...s, size: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <Select 
                    value={captionStyle.position} 
                    onValueChange={(v: CaptionStyle['position']) => 
                      setCaptionStyle(s => ({ ...s, position: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" onClick={generateClips} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="mr-2 h-3 w-3" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {clips.map((clip, index) => (
          <div
            key={index}
            className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-foreground">{clip.title}</h4>
                {getStatusIcon(clip.renderStatus)}
              </div>
              <div className={`flex items-center gap-1 ${getScoreColor(clip.score)}`}>
                <TrendingUp className="h-3 w-3" />
                <span className="text-sm font-medium">{clip.score}/10</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{clip.hook}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {clip.startTime} - {clip.endTime}
                </div>
                <div className="flex gap-1">
                  {clip.platforms.map((platform) => (
                    <span
                      key={platform}
                      className={`text-xs px-2 py-0.5 rounded-full border ${platformColors[platform] || 'bg-muted text-muted-foreground'}`}
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {clip.renderStatus === 'done' && clip.renderUrl ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPreviewUrl(clip.renderUrl!)}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      Preview
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => window.open(clip.renderUrl, '_blank')}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </>
                ) : clip.renderStatus === 'rendering' ? (
                  <Button variant="ghost" size="sm" disabled>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Rendering...
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-primary"
                    onClick={() => renderClip(index, clip.platforms[0] || 'tiktok')}
                    disabled={!mediaUrl || renderingClips.has(index)}
                  >
                    <Video className="mr-1 h-3 w-3" />
                    Create Clip
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}