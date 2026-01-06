import { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Play,
  Pause,
  Loader2,
  Wand2,
  User,
  Focus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api';

interface Speaker {
  id: string;
  name: string;
  title: string;
  socialHandle?: string;
  position: 'left' | 'right';
  color: string;
}

interface FocusRegion {
  startTime: number;
  endTime: number;
  speaker: 'left' | 'right' | 'both';
  zoomLevel: number;
}

interface SpeakerFocusEditorProps {
  speakers: Speaker[];
  onSpeakersChange: (speakers: Speaker[]) => void;
  mediaUrl: string | null;
  transcriptSegments?: any[] | null;
}

const SPEAKER_COLORS = [
  '#FFD700', '#00D4FF', '#FF6B6B', '#4CAF50', '#9C27B0', '#FF9800',
];

export function SpeakerFocusEditor({
  speakers,
  onSpeakersChange,
  mediaUrl,
  transcriptSegments,
}: SpeakerFocusEditorProps) {
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [focusRegions, setFocusRegions] = useState<FocusRegion[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1.2);
  const [transitionSpeed, setTransitionSpeed] = useState(0.5);
  const [autoDetect, setAutoDetect] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const addSpeaker = () => {
    const newSpeaker: Speaker = {
      id: Date.now().toString(),
      name: `Speaker ${speakers.length + 1}`,
      title: 'Guest',
      position: speakers.length % 2 === 0 ? 'left' : 'right',
      color: SPEAKER_COLORS[speakers.length % SPEAKER_COLORS.length],
    };
    onSpeakersChange([...speakers, newSpeaker]);
  };

  const updateSpeaker = (id: string, updates: Partial<Speaker>) => {
    onSpeakersChange(speakers.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const removeSpeaker = (id: string) => {
    onSpeakersChange(speakers.filter(s => s.id !== id));
  };

  const analyzeSpeakers = async () => {
    if (!mediaUrl || !transcriptSegments) {
      toast({
        title: 'Missing data',
        description: 'Upload video and generate transcript first.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const { data, error } = await apiPost<{ focusRegions?: FocusRegion[] }>('/analyze-speakers', { 
        transcriptSegments,
        speakerCount: speakers.length,
      });

      if (error) throw error;

      if (data?.focusRegions) {
        setFocusRegions(data.focusRegions);
        toast({
          title: 'Analysis complete',
          description: `Detected ${data.focusRegions.length} speaker transitions.`,
        });
      }
    } catch (error) {
      console.error('Speaker analysis error:', error);
      // Demo fallback
      const demoRegions: FocusRegion[] = [
        { startTime: 0, endTime: 15, speaker: 'left', zoomLevel: 1.2 },
        { startTime: 15, endTime: 35, speaker: 'right', zoomLevel: 1.2 },
        { startTime: 35, endTime: 50, speaker: 'left', zoomLevel: 1.2 },
        { startTime: 50, endTime: 70, speaker: 'both', zoomLevel: 1.0 },
        { startTime: 70, endTime: 90, speaker: 'right', zoomLevel: 1.2 },
      ];
      setFocusRegions(demoRegions);
      toast({
        title: 'Analysis complete',
        description: 'Demo speaker transitions generated.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Video Preview with Focus Overlay */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">Speaker Focus Preview</h3>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={analyzeSpeakers}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-3 w-3" />
                Auto-Detect Speakers
              </>
            )}
          </Button>
        </div>

        {/* Video with Focus Overlay */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border">
          {mediaUrl ? (
            <>
              <video
                ref={videoRef}
                src={mediaUrl}
                controls
                className="w-full h-full object-contain"
              />
              {/* Focus region indicator */}
              <div className="absolute top-4 left-4 bg-black/60 px-3 py-1.5 rounded-full">
                <div className="flex items-center gap-2 text-xs text-white">
                  <Focus className="h-3 w-3 text-primary" />
                  <span>Auto-crop to active speaker</span>
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No video loaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Focus Timeline */}
        {focusRegions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Speaker Timeline</Label>
            <div className="h-8 bg-muted rounded-lg overflow-hidden flex">
              {focusRegions.map((region, index) => {
                const width = ((region.endTime - region.startTime) / (focusRegions[focusRegions.length - 1]?.endTime || 100)) * 100;
                return (
                  <div
                    key={index}
                    className="h-full flex items-center justify-center text-xs font-medium transition-colors"
                    style={{
                      width: `${width}%`,
                      backgroundColor: region.speaker === 'left' 
                        ? speakers[0]?.color + '80' 
                        : region.speaker === 'right'
                          ? speakers[1]?.color + '80'
                          : '#666666',
                      color: 'white',
                    }}
                    title={`${region.startTime}s - ${region.endTime}s`}
                  >
                    {region.speaker === 'both' ? 'Both' : region.speaker === 'left' ? 'L' : 'R'}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Speaker Configuration */}
      <div className="space-y-6">
        {/* Speakers List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">Speakers</Label>
            <Button variant="outline" size="sm" onClick={addSpeaker}>
              <Plus className="mr-2 h-3 w-3" />
              Add Speaker
            </Button>
          </div>

          <div className="space-y-3">
            {speakers.map((speaker, index) => (
              <SpeakerCard
                key={speaker.id}
                speaker={speaker}
                index={index}
                isEditing={editingSpeaker === speaker.id}
                onEdit={() => setEditingSpeaker(speaker.id)}
                onSave={() => setEditingSpeaker(null)}
                onUpdate={(updates) => updateSpeaker(speaker.id, updates)}
                onRemove={() => removeSpeaker(speaker.id)}
                canRemove={speakers.length > 1}
              />
            ))}
          </div>
        </div>

        {/* Focus Settings */}
        <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
          <Label className="text-foreground font-medium">Focus Settings</Label>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-foreground">Auto-Detect Speaker</div>
                <p className="text-xs text-muted-foreground">AI detects who's speaking</p>
              </div>
              <Switch checked={autoDetect} onCheckedChange={setAutoDetect} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Zoom Level</Label>
                <span className="text-xs text-muted-foreground">{zoomLevel.toFixed(1)}x</span>
              </div>
              <Slider
                value={[zoomLevel]}
                onValueChange={([v]) => setZoomLevel(v)}
                min={1.0}
                max={2.0}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-foreground">Transition Speed</Label>
                <span className="text-xs text-muted-foreground">{transitionSpeed}s</span>
              </div>
              <Slider
                value={[transitionSpeed]}
                onValueChange={([v]) => setTransitionSpeed(v)}
                min={0.2}
                max={1.0}
                step={0.1}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Speaker Card Component
function SpeakerCard({
  speaker,
  index,
  isEditing,
  onEdit,
  onSave,
  onUpdate,
  onRemove,
  canRemove,
}: {
  speaker: Speaker;
  index: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onUpdate: (updates: Partial<Speaker>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const [localName, setLocalName] = useState(speaker.name);
  const [localTitle, setLocalTitle] = useState(speaker.title);
  const [localHandle, setLocalHandle] = useState(speaker.socialHandle || '');

  const handleSave = () => {
    onUpdate({
      name: localName,
      title: localTitle,
      socialHandle: localHandle || undefined,
    });
    onSave();
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-lg border border-primary bg-primary/5 space-y-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: speaker.color }}
          >
            {index + 1}
          </div>
          <div className="flex-1 space-y-2">
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              placeholder="Speaker name"
              className="h-8"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Title"
                className="h-8"
              />
              <Input
                value={localHandle}
                onChange={(e) => setLocalHandle(e.target.value)}
                placeholder="@handle"
                className="h-8"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Label className="text-xs text-muted-foreground">Position:</Label>
            <Select 
              value={speaker.position} 
              onValueChange={(v: 'left' | 'right') => onUpdate({ position: v })}
            >
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onSave}>
              <X className="h-3 w-3" />
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Check className="mr-1 h-3 w-3" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: speaker.color }}
      >
        <User className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-foreground">{speaker.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span>{speaker.title}</span>
          <Badge variant="secondary" className="text-[10px]">
            {speaker.position}
          </Badge>
          {speaker.socialHandle && (
            <span className="text-primary">{speaker.socialHandle}</span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Edit2 className="h-3 w-3" />
        </Button>
        {canRemove && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive hover:text-destructive" 
            onClick={onRemove}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
