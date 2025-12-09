import { useState } from 'react';
import { 
  Type, 
  Palette, 
  Settings, 
  Play,
  Pause,
  RotateCcw,
  Check,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Speaker {
  id: string;
  name: string;
  title: string;
  socialHandle?: string;
  position: 'left' | 'right';
  color: string;
}

interface LowerThirdStyle {
  template: 'animated-slide' | 'minimal' | 'bold' | 'gradient';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  font: string;
  showSocialHandle: boolean;
  animationDuration: number;
}

interface LowerThirdsEditorProps {
  speakers: Speaker[];
  style: LowerThirdStyle;
  onStyleChange: (style: LowerThirdStyle) => void;
}

const TEMPLATES = [
  { id: 'animated-slide', name: 'Animated Slide', description: 'Professional slide-in animation' },
  { id: 'minimal', name: 'Minimal Modern', description: 'Clean, subtle appearance' },
  { id: 'bold', name: 'Bold Impact', description: 'Strong, attention-grabbing' },
  { id: 'gradient', name: 'Gradient Glow', description: 'Modern gradient effect' },
];

const FONTS = [
  'Inter',
  'Montserrat',
  'Roboto',
  'Poppins',
  'Open Sans',
  'Raleway',
];

const PRESET_COLORS = [
  '#FFD700', // Gold
  '#00D4FF', // Cyan
  '#FF6B6B', // Coral
  '#4CAF50', // Green
  '#9C27B0', // Purple
  '#FF9800', // Orange
];

export function LowerThirdsEditor({
  speakers,
  style,
  onStyleChange,
}: LowerThirdsEditorProps) {
  const [previewSpeaker, setPreviewSpeaker] = useState<Speaker | null>(speakers[0] || null);
  const [isAnimating, setIsAnimating] = useState(false);

  const playAnimation = () => {
    setIsAnimating(false);
    setTimeout(() => setIsAnimating(true), 50);
    setTimeout(() => setIsAnimating(false), (style.animationDuration * 1000) + 3000);
  };

  const updateStyle = (updates: Partial<LowerThirdStyle>) => {
    onStyleChange({ ...style, ...updates });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground">Preview</h3>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={playAnimation}>
              <Play className="mr-2 h-3 w-3" />
              Play Animation
            </Button>
          </div>
        </div>
        
        {/* Preview Canvas */}
        <div className="relative aspect-video bg-gradient-to-br from-muted to-muted/50 rounded-lg overflow-hidden border border-border">
          {/* Simulated video background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-3/4">
              <div className="aspect-square bg-slate-700 rounded-lg flex items-center justify-center">
                <User className="h-16 w-16 text-slate-500" />
              </div>
              <div className="aspect-square bg-slate-700 rounded-lg flex items-center justify-center">
                <User className="h-16 w-16 text-slate-500" />
              </div>
            </div>
          </div>
          
          {/* Lower Third Overlay */}
          {previewSpeaker && (
            <div 
              className={`absolute bottom-8 transition-all duration-500 ${
                previewSpeaker.position === 'left' ? 'left-8' : 'right-8'
              } ${
                isAnimating 
                  ? 'opacity-100 translate-x-0' 
                  : previewSpeaker.position === 'left' 
                    ? 'opacity-0 -translate-x-8' 
                    : 'opacity-0 translate-x-8'
              }`}
              style={{ transitionDuration: `${style.animationDuration}s` }}
            >
              <LowerThirdPreview speaker={previewSpeaker} style={style} />
            </div>
          )}
        </div>
        
        {/* Speaker Selection */}
        <div className="flex gap-2">
          {speakers.map((speaker) => (
            <Button
              key={speaker.id}
              variant={previewSpeaker?.id === speaker.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewSpeaker(speaker)}
            >
              {speaker.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Settings */}
      <div className="space-y-6">
        {/* Template Selection */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Template Style</Label>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  style.template === template.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => updateStyle({ template: template.id as LowerThirdStyle['template'] })}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-foreground">{template.name}</span>
                  {style.template === template.id && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{template.description}</p>
              </button>
            ))}
          </div>
        </div>
        
        {/* Colors */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Colors</Label>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Accent Color</Label>
              <div className="flex gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      style.accentColor === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => updateStyle({ accentColor: color })}
                  />
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Background</Label>
              <div className="flex gap-2">
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    style.backgroundColor === 'rgba(0, 0, 0, 0.85)' ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
                  onClick={() => updateStyle({ backgroundColor: 'rgba(0, 0, 0, 0.85)' })}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    style.backgroundColor === 'rgba(255, 255, 255, 0.95)' ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
                  onClick={() => updateStyle({ backgroundColor: 'rgba(255, 255, 255, 0.95)' })}
                />
                <button
                  className={`w-8 h-8 rounded border-2 ${
                    style.backgroundColor === 'transparent' ? 'border-foreground' : 'border-border'
                  }`}
                  style={{ 
                    background: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px' 
                  }}
                  onClick={() => updateStyle({ backgroundColor: 'transparent' })}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Font */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">Font</Label>
          <Select value={style.font} onValueChange={(v) => updateStyle({ font: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Animation Duration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">Animation Speed</Label>
            <span className="text-sm text-muted-foreground">{style.animationDuration}s</span>
          </div>
          <Slider
            value={[style.animationDuration]}
            onValueChange={([v]) => updateStyle({ animationDuration: v })}
            min={0.2}
            max={1.5}
            step={0.1}
          />
        </div>
        
        {/* Options */}
        <div className="space-y-3">
          <Label className="text-foreground font-medium">Options</Label>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <div className="font-medium text-sm text-foreground">Show Social Handle</div>
              <p className="text-xs text-muted-foreground">Display @handles below name</p>
            </div>
            <Switch
              checked={style.showSocialHandle}
              onCheckedChange={(v) => updateStyle({ showSocialHandle: v })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Lower Third Preview Component
function LowerThirdPreview({ 
  speaker, 
  style 
}: { 
  speaker: Speaker; 
  style: LowerThirdStyle;
}) {
  const isLight = style.backgroundColor.includes('255');
  const textColor = isLight ? '#000000' : '#FFFFFF';
  
  if (style.template === 'minimal') {
    return (
      <div 
        className="px-4 py-2 rounded-lg backdrop-blur-sm"
        style={{ 
          backgroundColor: style.backgroundColor,
          fontFamily: style.font,
        }}
      >
        <div className="font-semibold text-lg" style={{ color: textColor }}>
          {speaker.name}
        </div>
        <div className="text-sm opacity-80" style={{ color: textColor }}>
          {speaker.title}
        </div>
        {style.showSocialHandle && speaker.socialHandle && (
          <div className="text-xs mt-1" style={{ color: style.accentColor }}>
            {speaker.socialHandle}
          </div>
        )}
      </div>
    );
  }
  
  if (style.template === 'bold') {
    return (
      <div className="flex items-stretch gap-0">
        <div 
          className="w-2 rounded-l"
          style={{ backgroundColor: style.accentColor }}
        />
        <div 
          className="px-5 py-3 rounded-r-lg"
          style={{ 
            backgroundColor: style.backgroundColor,
            fontFamily: style.font,
          }}
        >
          <div className="font-bold text-xl uppercase tracking-wide" style={{ color: textColor }}>
            {speaker.name}
          </div>
          <div className="text-sm font-medium" style={{ color: style.accentColor }}>
            {speaker.title}
          </div>
        </div>
      </div>
    );
  }
  
  if (style.template === 'gradient') {
    return (
      <div 
        className="px-5 py-3 rounded-lg"
        style={{ 
          background: `linear-gradient(135deg, ${style.backgroundColor}, ${style.accentColor}40)`,
          fontFamily: style.font,
          borderLeft: `3px solid ${style.accentColor}`,
        }}
      >
        <div className="font-semibold text-lg" style={{ color: textColor }}>
          {speaker.name}
        </div>
        <div className="text-sm" style={{ color: style.accentColor }}>
          {speaker.title}
        </div>
      </div>
    );
  }
  
  // Default: animated-slide
  return (
    <div className="flex items-stretch gap-0">
      <div 
        className="px-3 py-2 flex items-center"
        style={{ backgroundColor: style.accentColor }}
      >
        <User className="h-5 w-5" style={{ color: style.backgroundColor }} />
      </div>
      <div 
        className="px-4 py-2"
        style={{ 
          backgroundColor: style.backgroundColor,
          fontFamily: style.font,
        }}
      >
        <div className="font-semibold" style={{ color: textColor }}>
          {speaker.name}
        </div>
        <div className="text-xs opacity-80" style={{ color: textColor }}>
          {speaker.title}
        </div>
      </div>
      {style.showSocialHandle && speaker.socialHandle && (
        <div 
          className="px-3 py-2 flex items-center text-xs"
          style={{ 
            backgroundColor: style.accentColor + '40',
            color: style.accentColor,
          }}
        >
          {speaker.socialHandle}
        </div>
      )}
    </div>
  );
}
