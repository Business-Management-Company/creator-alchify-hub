import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api';
import { 
  User, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  Loader2, 
  Focus,
  Maximize2,
  Move,
  ZoomIn
} from 'lucide-react';

interface SpeakerSegment {
  startTime: number;
  endTime: number;
  speaker: string;
  focusRegion: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

interface SpeakerFocusProps {
  projectId: string;
  mediaUrl: string | null;
  transcriptContent: string | null;
  transcriptSegments: any[] | null;
}

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 Vertical', width: 9, height: 16 },
  { id: '1:1', label: '1:1 Square', width: 1, height: 1 },
  { id: '16:9', label: '16:9 Landscape', width: 16, height: 9 },
  { id: '4:5', label: '4:5 Portrait', width: 4, height: 5 },
];

export function SpeakerFocus({ projectId, mediaUrl, transcriptContent, transcriptSegments }: SpeakerFocusProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speakerSegments, setSpeakerSegments] = useState<SpeakerSegment[]>([]);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('9:16');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [smoothTransition, setSmoothTransition] = useState(true);
  const [transitionSpeed, setTransitionSpeed] = useState([0.5]);
  const [zoomLevel, setZoomLevel] = useState([1.2]);
  const [showFocusOverlay, setShowFocusOverlay] = useState(true);
  const [currentFocusRegion, setCurrentFocusRegion] = useState<SpeakerSegment['focusRegion'] | null>(null);

  // Update current focus region based on playback time
  useEffect(() => {
    if (speakerSegments.length === 0) return;
    
    const currentSegment = speakerSegments.find(
      seg => currentTime >= seg.startTime && currentTime <= seg.endTime
    );
    
    if (currentSegment) {
      setCurrentFocusRegion(currentSegment.focusRegion);
    }
  }, [currentTime, speakerSegments]);

  // Draw focus overlay on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !showFocusOverlay || !currentFocusRegion) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate focus region in canvas coordinates
    const aspectRatio = ASPECT_RATIOS.find(a => a.id === selectedAspectRatio);
    if (!aspectRatio) return;

    const focusWidth = canvas.width * currentFocusRegion.width * zoomLevel[0];
    const focusHeight = focusWidth * (aspectRatio.height / aspectRatio.width);
    const focusX = canvas.width * currentFocusRegion.x - focusWidth / 2;
    const focusY = canvas.height * currentFocusRegion.y - focusHeight / 2;

    // Clear focus region (make it visible)
    ctx.clearRect(focusX, focusY, focusWidth, focusHeight);
    
    // Draw focus border
    ctx.strokeStyle = 'hsl(var(--primary))';
    ctx.lineWidth = 3;
    ctx.strokeRect(focusX, focusY, focusWidth, focusHeight);
    
    // Draw corner markers
    const cornerSize = 12;
    ctx.fillStyle = 'hsl(var(--primary))';
    // Top-left
    ctx.fillRect(focusX - 2, focusY - 2, cornerSize, 4);
    ctx.fillRect(focusX - 2, focusY - 2, 4, cornerSize);
    // Top-right
    ctx.fillRect(focusX + focusWidth - cornerSize + 2, focusY - 2, cornerSize, 4);
    ctx.fillRect(focusX + focusWidth - 2, focusY - 2, 4, cornerSize);
    // Bottom-left
    ctx.fillRect(focusX - 2, focusY + focusHeight - 2, cornerSize, 4);
    ctx.fillRect(focusX - 2, focusY + focusHeight - cornerSize + 2, 4, cornerSize);
    // Bottom-right
    ctx.fillRect(focusX + focusWidth - cornerSize + 2, focusY + focusHeight - 2, cornerSize, 4);
    ctx.fillRect(focusX + focusWidth - 2, focusY + focusHeight - cornerSize + 2, 4, cornerSize);
  }, [currentFocusRegion, showFocusOverlay, selectedAspectRatio, zoomLevel]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const analyzeForSpeakers = async () => {
    if (!transcriptContent && !transcriptSegments) {
      toast({
        title: 'No transcript available',
        description: 'Please process your content first to analyze speakers.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await apiPost<{ speakerSegments?: SpeakerSegment[]; speakerCount?: number }>('/analyze-speakers', {
        projectId,
        transcriptContent,
        transcriptSegments,
        aspectRatio: selectedAspectRatio,
      });

      if (error) throw error;

      if (data?.speakerSegments) {
        setSpeakerSegments(data.speakerSegments);
        toast({
          title: 'Analysis complete',
          description: `Detected ${data.speakerCount || 1} speaker(s) with ${data.speakerSegments.length} focus regions.`,
        });
      }
    } catch (error) {
      console.error('Speaker analysis error:', error);
      
      // Generate demo data for preview
      const demoSegments: SpeakerSegment[] = [
        {
          startTime: 0,
          endTime: 5,
          speaker: 'Speaker 1',
          focusRegion: { x: 0.5, y: 0.4, width: 0.4, height: 0.5 },
          confidence: 0.92,
        },
        {
          startTime: 5,
          endTime: 12,
          speaker: 'Speaker 1',
          focusRegion: { x: 0.48, y: 0.38, width: 0.42, height: 0.52 },
          confidence: 0.88,
        },
        {
          startTime: 12,
          endTime: 20,
          speaker: 'Speaker 1',
          focusRegion: { x: 0.52, y: 0.42, width: 0.38, height: 0.48 },
          confidence: 0.95,
        },
      ];
      
      setSpeakerSegments(demoSegments);
      toast({
        title: 'Demo mode',
        description: 'Showing preview with simulated speaker detection.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSpeakerSegments([]);
    setCurrentFocusRegion(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mediaUrl) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium mb-2">No Video Available</h3>
            <p className="text-sm">Upload a video to use Speaker Focus.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Focus className="h-5 w-5 text-primary" />
                Speaker Focus Preview
              </CardTitle>
              <CardDescription>
                AI-powered dynamic framing for your content
              </CardDescription>
            </div>
            {speakerSegments.length > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {speakerSegments.length} regions detected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={mediaUrl}
              className="w-full h-full object-contain"
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={() => setIsPlaying(false)}
            />
            {showFocusOverlay && speakerSegments.length > 0 && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
              />
            )}
            
            {/* Playback controls overlay */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)}
                </span>
                {currentFocusRegion && (
                  <Badge variant="secondary" className="ml-auto">
                    Focus: {Math.round(currentFocusRegion.x * 100)}%, {Math.round(currentFocusRegion.y * 100)}%
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls Section */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Analysis Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Output Aspect Ratio</Label>
              <Select value={selectedAspectRatio} onValueChange={setSelectedAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(ratio => (
                    <SelectItem key={ratio.id} value={ratio.id}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={analyzeForSpeakers}
                disabled={isAnalyzing}
                className="flex-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Detect Speakers
                  </>
                )}
              </Button>
              {speakerSegments.length > 0 && (
                <Button variant="outline" size="icon" onClick={resetAnalysis}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
            </div>

            {speakerSegments.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Detected {speakerSegments.length} focus regions. Play the video to see dynamic framing in action.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Framing Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Move className="h-4 w-4" />
              Framing Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="overlay-toggle">Show Focus Overlay</Label>
              <Switch
                id="overlay-toggle"
                checked={showFocusOverlay}
                onCheckedChange={setShowFocusOverlay}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="smooth-toggle">Smooth Transitions</Label>
              <Switch
                id="smooth-toggle"
                checked={smoothTransition}
                onCheckedChange={setSmoothTransition}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Zoom Level
                </Label>
                <span className="text-sm text-muted-foreground">{zoomLevel[0].toFixed(1)}x</span>
              </div>
              <Slider
                value={zoomLevel}
                onValueChange={setZoomLevel}
                min={1}
                max={2}
                step={0.1}
              />
            </div>

            {smoothTransition && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Transition Speed</Label>
                  <span className="text-sm text-muted-foreground">{transitionSpeed[0].toFixed(1)}s</span>
                </div>
                <Slider
                  value={transitionSpeed}
                  onValueChange={setTransitionSpeed}
                  min={0.2}
                  max={1.5}
                  step={0.1}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detected Segments Timeline */}
      {speakerSegments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Focus Regions Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {speakerSegments.map((segment, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = segment.startTime;
                    }
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    currentTime >= segment.startTime && currentTime <= segment.endTime
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{segment.speaker}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {Math.round(segment.confidence * 100)}% confidence
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
