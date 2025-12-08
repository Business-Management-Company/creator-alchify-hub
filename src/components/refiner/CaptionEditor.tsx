import { useState, useEffect } from 'react';
import { 
  Captions, 
  Download, 
  Type, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  ChevronUp,
  ChevronDown,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface CaptionSegment {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

interface CaptionStyle {
  fontFamily: string;
  textCase: 'normal' | 'uppercase' | 'lowercase' | 'capitalize';
  position: 'top' | 'center' | 'bottom';
  fontSize: 'small' | 'medium' | 'large';
}

interface CaptionEditorProps {
  transcriptContent: string | null;
  onSave?: (captions: CaptionSegment[]) => void;
}

// Parse transcript with timestamps into segments
function parseTranscriptToSegments(content: string): CaptionSegment[] {
  if (!content) return [];
  
  const regex = /\[(\d{2}:\d{2})\]\s*([^\[]+)/g;
  const allMatches: { time: string; text: string }[] = [];
  let match;

  // First, collect all matches
  while ((match = regex.exec(content)) !== null) {
    allMatches.push({
      time: match[1],
      text: match[2].trim()
    });
  }

  // Then create segments with proper end times
  return allMatches.map((item, index) => {
    const startTime = item.time;
    let endTime: string;
    
    if (index < allMatches.length - 1) {
      // Use next segment's start time as end time
      endTime = allMatches[index + 1].time;
    } else {
      // Add 10 seconds for the last segment
      const [mins, secs] = startTime.split(':').map(Number);
      const totalSecs = mins * 60 + secs + 10;
      endTime = `${String(Math.floor(totalSecs / 60)).padStart(2, '0')}:${String(totalSecs % 60).padStart(2, '0')}`;
    }

    return {
      id: `seg-${index}`,
      startTime,
      endTime,
      text: item.text
    };
  });
}

// Convert time string to seconds
function timeToSeconds(time: string): number {
  const [mins, secs] = time.split(':').map(Number);
  return mins * 60 + secs;
}

// Convert seconds to SRT time format (00:00:00,000)
function secondsToSrtTime(totalSecs: number): string {
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.floor(totalSecs % 60);
  const ms = Math.round((totalSecs % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

// Convert seconds to WebVTT time format (00:00:00.000)
function secondsToVttTime(totalSecs: number): string {
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = Math.floor(totalSecs % 60);
  const ms = Math.round((totalSecs % 1) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// Generate SRT content
function generateSrt(segments: CaptionSegment[]): string {
  return segments.map((seg, i) => {
    const startSecs = timeToSeconds(seg.startTime);
    const endSecs = timeToSeconds(seg.endTime);
    return `${i + 1}\n${secondsToSrtTime(startSecs)} --> ${secondsToSrtTime(endSecs)}\n${seg.text}\n`;
  }).join('\n');
}

// Generate WebVTT content
function generateVtt(segments: CaptionSegment[]): string {
  const cues = segments.map((seg) => {
    const startSecs = timeToSeconds(seg.startTime);
    const endSecs = timeToSeconds(seg.endTime);
    return `${secondsToVttTime(startSecs)} --> ${secondsToVttTime(endSecs)}\n${seg.text}`;
  }).join('\n\n');
  
  return `WEBVTT\n\n${cues}`;
}

// Download file helper
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CaptionEditor({ transcriptContent, onSave }: CaptionEditorProps) {
  const [segments, setSegments] = useState<CaptionSegment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [style, setStyle] = useState<CaptionStyle>({
    fontFamily: 'Inter',
    textCase: 'normal',
    position: 'bottom',
    fontSize: 'medium'
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (transcriptContent) {
      const parsed = parseTranscriptToSegments(transcriptContent);
      setSegments(parsed);
    }
  }, [transcriptContent]);

  const updateSegment = (id: string, updates: Partial<CaptionSegment>) => {
    setSegments(prev => prev.map(seg => 
      seg.id === id ? { ...seg, ...updates } : seg
    ));
  };

  const handleExportSrt = () => {
    const srt = generateSrt(segments);
    downloadFile(srt, 'captions.srt', 'text/plain');
    toast({
      title: 'SRT exported!',
      description: 'Caption file downloaded successfully.',
    });
  };

  const handleExportVtt = () => {
    const vtt = generateVtt(segments);
    downloadFile(vtt, 'captions.vtt', 'text/vtt');
    toast({
      title: 'WebVTT exported!',
      description: 'Caption file downloaded successfully.',
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      onSave?.(segments);
      toast({
        title: 'Captions saved!',
        description: 'Your caption edits have been saved.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const applyTextCase = (text: string): string => {
    switch (style.textCase) {
      case 'uppercase': return text.toUpperCase();
      case 'lowercase': return text.toLowerCase();
      case 'capitalize': return text.replace(/\b\w/g, c => c.toUpperCase());
      default: return text;
    }
  };

  if (!transcriptContent || segments.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Captions className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Caption Editor</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground">
            Generate a transcript first to edit captions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 border border-border rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Captions className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Caption Editor</h2>
          <Badge variant="secondary">{segments.length} segments</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
            Save
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportSrt}>
                Download SRT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportVtt}>
                Download WebVTT
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Style Controls */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 bg-background/50 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={style.fontFamily} 
            onValueChange={(v) => setStyle(s => ({ ...s, fontFamily: v }))}
          >
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter">Inter</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-3">
          <Button 
            variant={style.textCase === 'uppercase' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setStyle(s => ({ ...s, textCase: 'uppercase' }))}
          >
            AA
          </Button>
          <Button 
            variant={style.textCase === 'lowercase' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setStyle(s => ({ ...s, textCase: 'lowercase' }))}
          >
            aa
          </Button>
          <Button 
            variant={style.textCase === 'capitalize' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setStyle(s => ({ ...s, textCase: 'capitalize' }))}
          >
            Aa
          </Button>
          <Button 
            variant={style.textCase === 'normal' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setStyle(s => ({ ...s, textCase: 'normal' }))}
          >
            Normal
          </Button>
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-3">
          <Button 
            variant={style.position === 'top' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2"
            onClick={() => setStyle(s => ({ ...s, position: 'top' }))}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button 
            variant={style.position === 'center' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2"
            onClick={() => setStyle(s => ({ ...s, position: 'center' }))}
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button 
            variant={style.position === 'bottom' ? 'secondary' : 'ghost'} 
            size="sm"
            className="h-8 px-2"
            onClick={() => setStyle(s => ({ ...s, position: 'bottom' }))}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-1 border-l border-border pl-3">
          <Select 
            value={style.fontSize} 
            onValueChange={(v: 'small' | 'medium' | 'large') => setStyle(s => ({ ...s, fontSize: v }))}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Caption Preview */}
      <div className="relative bg-muted/30 rounded-lg h-24 mb-4 flex items-center justify-center overflow-hidden">
        <div 
          className={`absolute w-full text-center px-4 ${
            style.position === 'top' ? 'top-2' : 
            style.position === 'center' ? 'top-1/2 -translate-y-1/2' : 
            'bottom-2'
          }`}
          style={{ fontFamily: style.fontFamily }}
        >
          <span className={`bg-black/70 text-foreground px-3 py-1 rounded ${
            style.fontSize === 'small' ? 'text-sm' : 
            style.fontSize === 'large' ? 'text-xl' : 
            'text-base'
          }`}>
            {applyTextCase(segments[0]?.text.slice(0, 60) || 'Caption preview...')}
          </span>
        </div>
      </div>

      {/* Timeline Segments */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {segments.map((segment) => (
          <div 
            key={segment.id}
            className={`p-3 rounded-lg border transition-colors cursor-pointer ${
              selectedSegment === segment.id 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-background/50 hover:border-primary/30'
            }`}
            onClick={() => setSelectedSegment(segment.id)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Input
                  value={segment.startTime}
                  onChange={(e) => updateSegment(segment.id, { startTime: e.target.value })}
                  className="w-16 h-7 text-xs text-center"
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  value={segment.endTime}
                  onChange={(e) => updateSegment(segment.id, { endTime: e.target.value })}
                  className="w-16 h-7 text-xs text-center"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {selectedSegment === segment.id ? (
              <Textarea
                value={segment.text}
                onChange={(e) => updateSegment(segment.id, { text: e.target.value })}
                className="min-h-[60px] text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <p className="text-sm text-foreground line-clamp-2">
                {applyTextCase(segment.text)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}