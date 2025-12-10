import { useState } from 'react';
import { 
  Type, 
  Palette, 
  Smile, 
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Play,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface CaptionStyleConfig {
  fontFamily: string;
  fontStyle: 'bold' | 'regular' | 'light';
  primaryColor: string;
  highlightColor: string;
  backgroundColor: string;
  position: 'top' | 'center' | 'bottom';
  size: 'small' | 'medium' | 'large';
  animation: 'highlight' | 'pop' | 'slide' | 'karaoke';
  enableEmojis: boolean;
  emojiStyle: 'auto' | 'minimal' | 'expressive';
  textShadow: boolean;
  outline: boolean;
}

interface CaptionStyleWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (config: CaptionStyleConfig) => void;
  initialConfig?: Partial<CaptionStyleConfig>;
}

const FONT_OPTIONS = [
  { 
    id: 'montserrat-bold', 
    name: 'Montserrat', 
    style: 'bold' as const,
    preview: 'THIS SUNDAY AT THIRD',
    className: 'font-bold uppercase tracking-wide'
  },
  { 
    id: 'inter-bold', 
    name: 'Inter', 
    style: 'bold' as const,
    preview: 'SO FIRST FOLKS HERE',
    className: 'font-bold uppercase'
  },
  { 
    id: 'poppins-bold', 
    name: 'Poppins', 
    style: 'bold' as const,
    preview: "WE'RE GIVING AWAY",
    className: 'font-bold uppercase'
  },
  { 
    id: 'roboto-bold', 
    name: 'Roboto', 
    style: 'bold' as const,
    preview: 'THE SECRET NOBODY TELLS',
    className: 'font-bold uppercase tracking-tight'
  },
  { 
    id: 'oswald', 
    name: 'Oswald', 
    style: 'bold' as const,
    preview: 'HOOK THAT GRABS ATTENTION',
    className: 'font-bold uppercase tracking-wider'
  },
];

const COLOR_PRESETS = [
  { 
    id: 'classic', 
    name: 'Classic White',
    primary: '#FFFFFF', 
    highlight: '#FFD700',
    bg: 'rgba(0,0,0,0.6)'
  },
  { 
    id: 'viral-green', 
    name: 'Viral Green',
    primary: '#FFFFFF', 
    highlight: '#00FF00',
    bg: 'rgba(0,0,0,0.5)'
  },
  { 
    id: 'fire-red', 
    name: 'Fire Red',
    primary: '#FFFFFF', 
    highlight: '#FF3B30',
    bg: 'rgba(0,0,0,0.5)'
  },
  { 
    id: 'ocean-blue', 
    name: 'Ocean Blue',
    primary: '#FFFFFF', 
    highlight: '#00BFFF',
    bg: 'rgba(0,0,0,0.5)'
  },
  { 
    id: 'sunset-orange', 
    name: 'Sunset Orange',
    primary: '#FFFFFF', 
    highlight: '#FF9500',
    bg: 'rgba(0,0,0,0.5)'
  },
  { 
    id: 'neon-pink', 
    name: 'Neon Pink',
    primary: '#FFFFFF', 
    highlight: '#FF69B4',
    bg: 'rgba(0,0,0,0.5)'
  },
];

const ANIMATION_OPTIONS = [
  { 
    id: 'highlight', 
    name: 'Word Highlight',
    description: 'Active word changes color',
    icon: '✨'
  },
  { 
    id: 'pop', 
    name: 'Pop In',
    description: 'Words pop with scale',
    icon: '💥'
  },
  { 
    id: 'karaoke', 
    name: 'Karaoke Style',
    description: 'Words fill with color',
    icon: '🎤'
  },
  { 
    id: 'slide', 
    name: 'Slide Up',
    description: 'Smooth slide animation',
    icon: '📱'
  },
];

const EMOJI_STYLES = [
  { id: 'auto', name: 'AI Auto', description: 'AI adds relevant emojis automatically' },
  { id: 'minimal', name: 'Minimal', description: 'Only key moments get emojis' },
  { id: 'expressive', name: 'Expressive', description: 'Emojis for emphasis and emotion' },
];

export function CaptionStyleWizard({ 
  isOpen, 
  onClose, 
  onComplete,
  initialConfig 
}: CaptionStyleWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<CaptionStyleConfig>({
    fontFamily: 'Montserrat',
    fontStyle: 'bold',
    primaryColor: '#FFFFFF',
    highlightColor: '#FFD700',
    backgroundColor: 'rgba(0,0,0,0.6)',
    position: 'top',
    size: 'large',
    animation: 'highlight',
    enableEmojis: true,
    emojiStyle: 'auto',
    textShadow: true,
    outline: true,
    ...initialConfig,
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(config);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const selectFont = (font: typeof FONT_OPTIONS[0]) => {
    setConfig(prev => ({
      ...prev,
      fontFamily: font.name,
      fontStyle: font.style,
    }));
  };

  const selectColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setConfig(prev => ({
      ...prev,
      primaryColor: preset.primary,
      highlightColor: preset.highlight,
      backgroundColor: preset.bg,
    }));
  };

  const selectAnimation = (animId: string) => {
    setConfig(prev => ({
      ...prev,
      animation: animId as CaptionStyleConfig['animation'],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wand2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Caption Style</h2>
                <p className="text-sm text-muted-foreground">
                  Step {step} of {totalSteps}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div 
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i + 1 <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Font Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Type className="h-10 w-10 mx-auto mb-2 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Choose Your Font</h3>
                <p className="text-muted-foreground">Select the typography style for your captions</p>
              </div>
              
              <div className="grid gap-3">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.id}
                    onClick={() => selectFont(font)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      config.fontFamily === font.name
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">{font.name}</p>
                        <p className={`text-xl text-foreground ${font.className}`}>
                          {font.preview}
                        </p>
                      </div>
                      {config.fontFamily === font.name && (
                        <div className="p-1 rounded-full bg-primary">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Color Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Palette className="h-10 w-10 mx-auto mb-2 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Pick Your Colors</h3>
                <p className="text-muted-foreground">Choose a color scheme that pops</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => selectColorPreset(preset)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      config.highlightColor === preset.highlight
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg"
                        style={{ 
                          backgroundColor: preset.bg,
                          color: preset.highlight
                        }}
                      >
                        A
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-foreground">{preset.name}</p>
                        <div className="flex gap-1 mt-1">
                          <div 
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div 
                            className="w-4 h-4 rounded-full border border-border"
                            style={{ backgroundColor: preset.highlight }}
                          />
                        </div>
                      </div>
                    </div>
                    {config.highlightColor === preset.highlight && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Preview */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">Preview</p>
                  <div 
                    className="p-4 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: config.backgroundColor }}
                  >
                    <p className="text-2xl font-bold uppercase tracking-wide">
                      <span style={{ color: config.primaryColor }}>WE'RE </span>
                      <span style={{ color: config.highlightColor }}>GIVING</span>
                      <span style={{ color: config.primaryColor }}> AWAY</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Animation Style */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Sparkles className="h-10 w-10 mx-auto mb-2 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Animation Style</h3>
                <p className="text-muted-foreground">How should your captions animate?</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {ANIMATION_OPTIONS.map((anim) => (
                  <button
                    key={anim.id}
                    onClick={() => selectAnimation(anim.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-center ${
                      config.animation === anim.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 bg-background'
                    }`}
                  >
                    <span className="text-3xl mb-2 block">{anim.icon}</span>
                    <p className="font-medium text-foreground">{anim.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{anim.description}</p>
                    {config.animation === anim.id && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-primary">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Additional Options */}
              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <Label className="font-medium">Text Shadow</Label>
                    <p className="text-xs text-muted-foreground">Adds depth for readability</p>
                  </div>
                  <Switch
                    checked={config.textShadow}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, textShadow: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <Label className="font-medium">Text Outline</Label>
                    <p className="text-xs text-muted-foreground">Bold outline around text</p>
                  </div>
                  <Switch
                    checked={config.outline}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, outline: checked }))}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Emoji Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <Smile className="h-10 w-10 mx-auto mb-2 text-primary" />
                <h3 className="text-xl font-bold text-foreground">Emoji Magic</h3>
                <p className="text-muted-foreground">Add personality with emojis</p>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                <div>
                  <Label className="font-medium text-lg">Enable Emojis</Label>
                  <p className="text-sm text-muted-foreground">AI adds contextual emojis to captions</p>
                </div>
                <Switch
                  checked={config.enableEmojis}
                  onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableEmojis: checked }))}
                />
              </div>

              {config.enableEmojis && (
                <RadioGroup 
                  value={config.emojiStyle}
                  onValueChange={(value) => setConfig(prev => ({ 
                    ...prev, 
                    emojiStyle: value as CaptionStyleConfig['emojiStyle'] 
                  }))}
                  className="space-y-3"
                >
                  {EMOJI_STYLES.map((style) => (
                    <div
                      key={style.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        config.emojiStyle === style.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50 bg-background'
                      }`}
                      onClick={() => setConfig(prev => ({ 
                        ...prev, 
                        emojiStyle: style.id as CaptionStyleConfig['emojiStyle'] 
                      }))}
                    >
                      <RadioGroupItem value={style.id} id={style.id} />
                      <div className="flex-1">
                        <Label htmlFor={style.id} className="font-medium cursor-pointer">
                          {style.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{style.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {/* Example Preview */}
              <Card className="mt-4">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-2">Example</p>
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: config.backgroundColor }}
                  >
                    <p className="text-xl font-bold uppercase tracking-wide" style={{ color: config.primaryColor }}>
                      {config.enableEmojis ? (
                        <>
                          <span>🎉 </span>
                          <span>WE'RE </span>
                          <span style={{ color: config.highlightColor }}>GIVING</span>
                          <span> AWAY</span>
                          <span> 💯</span>
                        </>
                      ) : (
                        <>
                          <span>WE'RE </span>
                          <span style={{ color: config.highlightColor }}>GIVING</span>
                          <span> AWAY</span>
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={step === 1 ? onClose : handleBack}
          >
            {step === 1 ? 'Cancel' : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </>
            )}
          </Button>
          
          <Button onClick={handleNext} variant="hero">
            {step === totalSteps ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Style
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
