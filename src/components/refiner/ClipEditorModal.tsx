import { useState, useRef, useEffect } from 'react';
import {
  Heart,
  ThumbsDown,
  Share2,
  Download,
  Scissors,
  Sparkles,
  Volume2,
  Image,
  Play,
  ChevronUp,
  ChevronDown,
  X,
  Monitor,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

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

interface ClipEditorModalProps {
  clip: Clip;
  clipIndex: number;
  totalClips: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  transcriptContent?: string | null;
  mediaUrl?: string | null;
}

// Calculate score grades based on the overall score
function getScoreGrades(score: number): { hook: string; flow: string; value: string; trend: string } {
  const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
  const baseIndex = Math.max(0, Math.min(7, 10 - score));
  
  return {
    hook: grades[Math.max(0, baseIndex - 1)] || 'A-',
    flow: grades[baseIndex] || 'A',
    value: grades[Math.max(0, baseIndex - 1)] || 'A-',
    trend: grades[Math.max(0, baseIndex - 1)] || 'A-',
  };
}

function timeToSeconds(time: string): number {
  const parts = time.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function ClipEditorModal({
  clip,
  clipIndex,
  totalClips,
  isOpen,
  onClose,
  onNavigate,
  transcriptContent,
  mediaUrl,
}: ClipEditorModalProps) {
  const [showTranscriptOnly, setShowTranscriptOnly] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const grades = getScoreGrades(clip.score);
  
  // Extract transcript for clip time range
  const clipTranscript = transcriptContent || clip.hook;
  
  // Calculate clip start and end times in seconds
  const clipStartSeconds = timeToSeconds(clip.startTime);
  const clipEndSeconds = timeToSeconds(clip.endTime);
  
  // Set video to clip start time when loaded
  useEffect(() => {
    if (videoRef.current && mediaUrl) {
      videoRef.current.currentTime = clipStartSeconds;
    }
  }, [mediaUrl, clipStartSeconds, clip]);
  
  // Handle time update to stop at clip end
  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime >= clipEndSeconds) {
      videoRef.current.pause();
      videoRef.current.currentTime = clipStartSeconds;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl bg-card border-border p-0 gap-0 overflow-hidden">
        {/* Header with title and navigation */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              #{clipIndex + 1}
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{clip.title}</h2>
              <button className="p-1 hover:bg-muted rounded">
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          
          {/* Navigation arrows */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('prev')}
              disabled={clipIndex === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onNavigate('next')}
              disabled={clipIndex === totalClips - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex">
          {/* Left sidebar - Score */}
          <div className="w-32 border-r border-border p-4 space-y-4">
            {/* Like/Dislike buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <ThumbsDown className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Score */}
            <div>
              <div className="text-4xl font-bold text-primary">{clip.score * 10}</div>
              <div className="text-sm text-muted-foreground">/100</div>
            </div>
            
            {/* Grade breakdown */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-green-500">{grades.hook}</span>
                <span className="text-muted-foreground">Hook</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500">{grades.flow}</span>
                <span className="text-muted-foreground">Flow</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500">{grades.value}</span>
                <span className="text-muted-foreground">Value</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-500">{grades.trend}</span>
                <span className="text-muted-foreground">Trend</span>
              </div>
            </div>
          </div>
          
          {/* Center - Video Preview */}
          <div className="flex-1 p-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              {/* Low-res preview badge */}
              <div className="absolute top-3 left-3 z-10 bg-black/60 text-primary text-xs px-2 py-1 rounded font-medium">
                LOW-RES PREVIEW
              </div>
              
              {/* Time display */}
              <div className="absolute top-3 right-3 z-10 bg-black/60 text-white text-xs px-2 py-1 rounded">
                00:00 <span className="text-muted-foreground">
                  {Math.floor(timeToSeconds(clip.endTime) - timeToSeconds(clip.startTime))}:{String(Math.floor((timeToSeconds(clip.endTime) - timeToSeconds(clip.startTime)) % 60)).padStart(2, '0')}
                </span>
              </div>
              
              {mediaUrl ? (
                <video
                  ref={videoRef}
                  src={mediaUrl}
                  controls
                  className="w-full h-full object-contain"
                  onLoadedMetadata={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = clipStartSeconds;
                    }
                  }}
                  onTimeUpdate={handleTimeUpdate}
                />
              ) : clip.renderUrl ? (
                <video
                  src={clip.renderUrl}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-white/50 mx-auto mb-2" />
                    <p className="text-white/70">Preview not available</p>
                  </div>
                </div>
              )}
              
              {/* Caption overlay simulation */}
              <div className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none">
                <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded font-bold text-lg uppercase tracking-wide">
                  {clip.hook.split(' ').slice(0, 4).join(' ')}
                </div>
              </div>
            </div>
            
            {/* Transcript section */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Scene analysis</span>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="transcript-only"
                    checked={showTranscriptOnly}
                    onCheckedChange={(checked) => setShowTranscriptOnly(checked as boolean)}
                  />
                  <label htmlFor="transcript-only" className="text-sm text-muted-foreground cursor-pointer">
                    Transcript only
                  </label>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div className="text-xs text-muted-foreground mb-2">
                  [{clip.startTime} - {clip.endTime}]
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {clipTranscript}
                </p>
              </div>
            </div>
          </div>
          
          {/* Right sidebar - Actions */}
          <div className="w-48 border-l border-border p-4 space-y-2">
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Publish on Social
            </Button>
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export XML
            </Button>
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Download HD
            </Button>
            
            <div className="border-t border-border my-3" />
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Scissors className="mr-2 h-4 w-4" />
              Edit clip
            </Button>
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Sparkles className="mr-2 h-4 w-4" />
              AI hook
              <Badge variant="secondary" className="ml-auto text-[10px]">Beta</Badge>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Volume2 className="mr-2 h-4 w-4" />
              Enhance speech
              <Badge variant="secondary" className="ml-auto text-[10px]">Beta</Badge>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Image className="mr-2 h-4 w-4" />
              Add B-Roll
              <Badge variant="secondary" className="ml-auto text-[10px]">Beta</Badge>
            </Button>
            
            <Button variant="outline" className="w-full justify-start" size="sm">
              <Monitor className="mr-2 h-4 w-4" />
              16:9
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
