import { 
  Volume2, 
  Video, 
  Wand2,
  VolumeX,
  Mic,
  Waves,
  Palette,
  Move,
  Sparkles
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';

interface Enhancements {
  audioNormalization: boolean;
  noiseReduction: boolean;
  silenceRemoval: boolean;
  videoStabilization: boolean;
  colorCorrection: boolean;
  speakerFocus: boolean;
}

interface AudioVideoEnhancerProps {
  enhancements: Enhancements;
  onEnhancementsChange: (enhancements: Enhancements) => void;
}

export function AudioVideoEnhancer({
  enhancements,
  onEnhancementsChange,
}: AudioVideoEnhancerProps) {
  const updateEnhancement = (key: keyof Enhancements, value: boolean) => {
    onEnhancementsChange({ ...enhancements, [key]: value });
  };

  const audioEnhancements = [
    {
      key: 'audioNormalization' as const,
      icon: Volume2,
      title: 'Audio Normalization',
      description: 'Balance volume levels across the entire podcast',
      badge: 'Recommended',
    },
    {
      key: 'noiseReduction' as const,
      icon: VolumeX,
      title: 'Noise Reduction',
      description: 'Remove background noise, hums, and hiss',
      badge: 'Recommended',
    },
    {
      key: 'silenceRemoval' as const,
      icon: Waves,
      title: 'Silence Removal',
      description: 'Trim excessive pauses and dead air',
      badge: null,
    },
  ];

  const videoEnhancements = [
    {
      key: 'colorCorrection' as const,
      icon: Palette,
      title: 'Color Correction',
      description: 'Enhance colors and improve video quality',
      badge: 'Recommended',
    },
    {
      key: 'videoStabilization' as const,
      icon: Move,
      title: 'Video Stabilization',
      description: 'Reduce camera shake and jitter',
      badge: null,
    },
    {
      key: 'speakerFocus' as const,
      icon: Sparkles,
      title: 'Speaker Focus',
      description: 'Auto-crop to active speaker in frame',
      badge: 'AI Powered',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Audio Enhancements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Volume2 className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Audio Enhancements</h3>
        </div>

        <div className="space-y-3">
          {audioEnhancements.map((item) => (
            <EnhancementCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
              badge={item.badge}
              enabled={enhancements[item.key]}
              onToggle={(v) => updateEnhancement(item.key, v)}
            />
          ))}
        </div>

        {/* Audio Preview */}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Mic className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm text-muted-foreground">Audio Processing Preview</Label>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Volume Peaks</span>
              <span className="text-foreground">Balanced</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-primary rounded-full" />
            </div>
          </div>
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Noise Floor</span>
              <span className="text-foreground">-60 dB</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-green-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Video Enhancements */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Video className="h-5 w-5 text-primary" />
          <h3 className="font-medium text-foreground">Video Enhancements</h3>
        </div>

        <div className="space-y-3">
          {videoEnhancements.map((item) => (
            <EnhancementCard
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
              badge={item.badge}
              enabled={enhancements[item.key]}
              onToggle={(v) => updateEnhancement(item.key, v)}
            />
          ))}
        </div>

        {/* Video Preview */}
        <div className="p-4 rounded-lg border border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm text-muted-foreground">Video Processing Preview</Label>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <span className="text-[10px] text-white/50">Original</span>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-500/20" />
              </div>
              <span className="text-[10px] text-muted-foreground">Before</span>
            </div>
            <div className="space-y-1">
              <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden">
                <span className="text-[10px] text-white/50">Enhanced</span>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/10" />
              </div>
              <span className="text-[10px] text-muted-foreground">After</span>
            </div>
          </div>
        </div>

        {/* Processing Summary */}
        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm text-foreground">Processing Summary</span>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {Object.entries(enhancements).filter(([, enabled]) => enabled).map(([key]) => (
              <li key={key} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary" />
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </li>
            ))}
            {Object.values(enhancements).every(v => !v) && (
              <li className="text-muted-foreground/50">No enhancements selected</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

// Enhancement Card Component
function EnhancementCard({
  icon: Icon,
  title,
  description,
  badge,
  enabled,
  onToggle,
}: {
  icon: any;
  title: string;
  description: string;
  badge: string | null;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div 
      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
        enabled 
          ? 'border-primary bg-primary/5' 
          : 'border-border bg-card hover:border-primary/30'
      }`}
      onClick={() => onToggle(!enabled)}
    >
      <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{title}</span>
          {badge && (
            <Badge 
              variant={badge === 'AI Powered' ? 'default' : 'secondary'} 
              className="text-[10px]"
            >
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}
