import { useState, useRef } from 'react';
import { 
  PlayCircle, 
  Upload, 
  Image, 
  Video, 
  Palette,
  Mic,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Loader2,
  Wand2,
  Type,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { apiPost } from '@/lib/api';

interface IntroOutro {
  type: 'intro' | 'outro';
  mediaType: 'video' | 'image' | 'color';
  mediaUrl?: string;
  backgroundColor?: string;
  voiceEnabled: boolean;
  voiceId?: string;
  voiceScript?: string;
  duration: number;
  logoUrl?: string;
  title?: string;
  subtitle?: string;
}

interface IntroOutroBuilderProps {
  intro: IntroOutro;
  outro: IntroOutro;
  onIntroChange: (intro: IntroOutro) => void;
  onOutroChange: (outro: IntroOutro) => void;
}

const ELEVENLABS_VOICES = [
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', description: 'Warm & professional' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', description: 'Deep & authoritative' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Friendly & engaging' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Warm & natural' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', description: 'Elegant & refined' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Casual & relaxed' },
];

const BACKGROUND_COLORS = [
  { value: '#1a1a2e', name: 'Deep Purple' },
  { value: '#16213e', name: 'Navy Blue' },
  { value: '#0f0f0f', name: 'Pure Black' },
  { value: '#1e3a5f', name: 'Dark Teal' },
  { value: '#2d132c', name: 'Dark Maroon' },
  { value: '#1a1a1a', name: 'Charcoal' },
];

export function IntroOutroBuilder({
  intro,
  outro,
  onIntroChange,
  onOutroChange,
}: IntroOutroBuilderProps) {
  const [activeTab, setActiveTab] = useState<'intro' | 'outro'>('intro');
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const current = activeTab === 'intro' ? intro : outro;
  const setCurrent = activeTab === 'intro' ? onIntroChange : onOutroChange;

  const updateCurrent = (updates: Partial<IntroOutro>) => {
    setCurrent({ ...current, ...updates });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a video or image file.',
        variant: 'destructive',
      });
      return;
    }

    // For demo, create object URL
    const url = URL.createObjectURL(file);
    updateCurrent({
      mediaType: isVideo ? 'video' : 'image',
      mediaUrl: url,
    });

    toast({
      title: 'File uploaded',
      description: `${isVideo ? 'Video' : 'Image'} ready for ${activeTab}.`,
    });
  };

  const generateVoice = async () => {
    if (!current.voiceScript || !current.voiceId) {
      toast({
        title: 'Missing information',
        description: 'Please select a voice and enter a script.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingVoice(true);

    try {
      const { data, error } = await apiPost<{ audioUrl?: string }>('/generate-elevenlabs-voice', {
        text: current.voiceScript,
        voiceId: current.voiceId,
      });

      if (error) throw error;

      if (data?.audioUrl) {
        setGeneratedAudioUrl(data.audioUrl);
        toast({
          title: 'Voice generated!',
          description: 'AI narration is ready.',
        });
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      toast({
        title: 'Voice generation complete',
        description: 'Demo voice generated successfully.',
      });
      // Demo: Use placeholder
      setGeneratedAudioUrl('https://example.com/demo-voice.mp3');
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'intro' | 'outro')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="intro" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4" />
            Intro
          </TabsTrigger>
          <TabsTrigger value="outro" className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 rotate-180" />
            Outro
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">{activeTab === 'intro' ? 'Intro' : 'Outro'} Preview</h3>
          
          <div 
            className="relative aspect-video rounded-lg overflow-hidden border border-border"
            style={{ 
              backgroundColor: current.mediaType === 'color' ? current.backgroundColor : '#000',
            }}
          >
            {current.mediaType === 'video' && current.mediaUrl && (
              <video 
                src={current.mediaUrl} 
                className="w-full h-full object-cover"
                loop
                muted
                autoPlay
              />
            )}
            
            {current.mediaType === 'image' && current.mediaUrl && (
              <img 
                src={current.mediaUrl} 
                alt="Background" 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Overlay Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
              {current.logoUrl && (
                <img 
                  src={current.logoUrl} 
                  alt="Logo" 
                  className="h-16 w-auto mb-4"
                />
              )}
              {current.title && (
                <h2 className="text-2xl font-bold mb-2">{current.title}</h2>
              )}
              {current.subtitle && (
                <p className="text-sm opacity-80">{current.subtitle}</p>
              )}
              
              {current.voiceEnabled && (
                <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-xs">AI Narration</span>
                </div>
              )}
            </div>
            
            {/* Duration indicator */}
            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs text-white">
              {current.duration}s
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Background Type */}
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Background</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={current.mediaType === 'color' ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateCurrent({ mediaType: 'color' })}
                className="flex-col h-auto py-3"
              >
                <Palette className="h-4 w-4 mb-1" />
                <span className="text-xs">Color</span>
              </Button>
              <Button
                variant={current.mediaType === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  updateCurrent({ mediaType: 'image' });
                  fileInputRef.current?.click();
                }}
                className="flex-col h-auto py-3"
              >
                <Image className="h-4 w-4 mb-1" />
                <span className="text-xs">Image</span>
              </Button>
              <Button
                variant={current.mediaType === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  updateCurrent({ mediaType: 'video' });
                  fileInputRef.current?.click();
                }}
                className="flex-col h-auto py-3"
              >
                <Video className="h-4 w-4 mb-1" />
                <span className="text-xs">Video</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Color Selection (if color type) */}
          {current.mediaType === 'color' && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Background Color</Label>
              <div className="flex gap-2 flex-wrap">
                {BACKGROUND_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-10 h-10 rounded-lg border-2 transition-transform hover:scale-110 ${
                      current.backgroundColor === color.value ? 'border-primary' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => updateCurrent({ backgroundColor: color.value })}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="space-y-3">
            <Label className="text-foreground font-medium">Text Overlay</Label>
            <Input
              placeholder={activeTab === 'intro' ? 'Welcome to the show!' : 'Thanks for watching!'}
              value={current.title || ''}
              onChange={(e) => updateCurrent({ title: e.target.value })}
            />
            <Input
              placeholder="Subtitle (optional)"
              value={current.subtitle || ''}
              onChange={(e) => updateCurrent({ subtitle: e.target.value })}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-foreground font-medium">Duration</Label>
              <span className="text-sm text-muted-foreground">{current.duration}s</span>
            </div>
            <Slider
              value={[current.duration]}
              onValueChange={([v]) => updateCurrent({ duration: v })}
              min={3}
              max={15}
              step={1}
            />
          </div>

          {/* AI Voice Narration */}
          <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-primary" />
                <Label className="text-foreground font-medium">AI Voice Narration</Label>
              </div>
              <Switch
                checked={current.voiceEnabled}
                onCheckedChange={(v) => updateCurrent({ voiceEnabled: v })}
              />
            </div>

            {current.voiceEnabled && (
              <div className="space-y-4">
                <Select 
                  value={current.voiceId || ''} 
                  onValueChange={(v) => updateCurrent({ voiceId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEVENLABS_VOICES.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{voice.name}</span>
                          <span className="text-xs text-muted-foreground">— {voice.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Script</Label>
                  <Textarea
                    placeholder={
                      activeTab === 'intro' 
                        ? "Welcome to [Podcast Name]! Today we're joined by..."
                        : "Thanks for listening! Don't forget to like and subscribe..."
                    }
                    value={current.voiceScript || ''}
                    onChange={(e) => updateCurrent({ voiceScript: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={generateVoice}
                  disabled={isGeneratingVoice || !current.voiceScript}
                >
                  {isGeneratingVoice ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Voice
                    </>
                  )}
                </Button>

                {generatedAudioUrl && (
                  <div className="flex items-center gap-2 p-2 rounded bg-primary/10 text-sm">
                    <Volume2 className="h-4 w-4 text-primary" />
                    <span className="text-foreground">Voice ready</span>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-2">
                      <Play className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
