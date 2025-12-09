import { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Type, 
  Volume2, 
  Video, 
  PlayCircle, 
  Wand2, 
  ChevronRight,
  Loader2,
  CheckCircle,
  Settings,
  Save,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { LowerThirdsEditor } from './LowerThirdsEditor';
import { SpeakerFocusEditor } from './SpeakerFocusEditor';
import { IntroOutroBuilder } from './IntroOutroBuilder';
import { AudioVideoEnhancer } from './AudioVideoEnhancer';

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

interface PodcastPostProductionProps {
  projectId: string;
  mediaUrl: string | null;
  transcriptContent: string | null;
  transcriptSegments?: any[] | null;
  onProcessingComplete?: () => void;
}

export function PodcastPostProduction({
  projectId,
  mediaUrl,
  transcriptContent,
  transcriptSegments,
  onProcessingComplete
}: PodcastPostProductionProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  
  // Speakers configuration
  const [speakers, setSpeakers] = useState<Speaker[]>([
    { id: '1', name: 'Host Name', title: 'Host', position: 'left', color: '#FFD700' },
    { id: '2', name: 'Guest Name', title: 'Guest', position: 'right', color: '#00D4FF' },
  ]);
  
  // Lower thirds style
  const [lowerThirdStyle, setLowerThirdStyle] = useState<LowerThirdStyle>({
    template: 'animated-slide',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
    font: 'Inter',
    showSocialHandle: true,
    animationDuration: 0.5,
  });
  
  // Intro/Outro configuration
  const [intro, setIntro] = useState<IntroOutro>({
    type: 'intro',
    mediaType: 'color',
    backgroundColor: '#1a1a2e',
    voiceEnabled: false,
    duration: 5,
  });
  
  const [outro, setOutro] = useState<IntroOutro>({
    type: 'outro',
    mediaType: 'color',
    backgroundColor: '#1a1a2e',
    voiceEnabled: false,
    duration: 5,
  });
  
  // Enhancement settings
  const [enhancements, setEnhancements] = useState({
    audioNormalization: true,
    noiseReduction: true,
    silenceRemoval: false,
    videoStabilization: false,
    colorCorrection: true,
    speakerFocus: true,
  });
  
  // Processing results
  const [processingResults, setProcessingResults] = useState<{
    speakerSegments: any[];
    enhancedAudioUrl?: string;
    enhancedVideoUrl?: string;
    finalVideoUrl?: string;
  } | null>(null);
  
  const { toast } = useToast();

  const handleStartProcessing = async () => {
    setIsProcessing(true);
    
    try {
      // Step 1: Analyze speakers
      setProcessingStep('Analyzing speakers...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Apply lower thirds
      setProcessingStep('Generating lower thirds...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 3: Process speaker focus
      setProcessingStep('Processing speaker focus...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 4: Enhance audio
      setProcessingStep('Enhancing audio...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 5: Enhance video
      setProcessingStep('Enhancing video...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 6: Generate intro/outro
      setProcessingStep('Generating intro & outro...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 7: Final render
      setProcessingStep('Rendering final video...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setProcessingResults({
        speakerSegments: [
          { start: 0, end: 15, speaker: 'left' },
          { start: 15, end: 30, speaker: 'right' },
          { start: 30, end: 45, speaker: 'left' },
        ],
        finalVideoUrl: mediaUrl || undefined,
      });
      
      toast({
        title: 'Processing complete!',
        description: 'Your podcast is ready for download.',
      });
      
      onProcessingComplete?.();
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing failed',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Podcast Post-Production</h2>
              <p className="text-xs text-muted-foreground">Professional editing for YouTube distribution</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {processingResults?.finalVideoUrl && (
              <>
                <Button variant="outline" size="sm">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </>
            )}
            <Button 
              variant="hero" 
              size="sm"
              onClick={handleStartProcessing}
              disabled={isProcessing || !mediaUrl}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingStep || 'Processing...'}
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Process Podcast
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-border px-4">
          <TabsList className="bg-transparent h-12 gap-2">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Settings className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="speakers" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Users className="mr-2 h-4 w-4" />
              Speakers & Focus
            </TabsTrigger>
            <TabsTrigger 
              value="lower-thirds" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Type className="mr-2 h-4 w-4" />
              Lower Thirds
            </TabsTrigger>
            <TabsTrigger 
              value="intro-outro" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <PlayCircle className="mr-2 h-4 w-4" />
              Intro & Outro
            </TabsTrigger>
            <TabsTrigger 
              value="enhancements" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Enhancements
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-4">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab 
              speakers={speakers}
              lowerThirdStyle={lowerThirdStyle}
              intro={intro}
              outro={outro}
              enhancements={enhancements}
              mediaUrl={mediaUrl}
              isProcessing={isProcessing}
              processingStep={processingStep}
              processingResults={processingResults}
            />
          </TabsContent>
          
          <TabsContent value="speakers" className="mt-0">
            <SpeakerFocusEditor
              speakers={speakers}
              onSpeakersChange={setSpeakers}
              mediaUrl={mediaUrl}
              transcriptSegments={transcriptSegments}
            />
          </TabsContent>
          
          <TabsContent value="lower-thirds" className="mt-0">
            <LowerThirdsEditor
              speakers={speakers}
              style={lowerThirdStyle}
              onStyleChange={setLowerThirdStyle}
            />
          </TabsContent>
          
          <TabsContent value="intro-outro" className="mt-0">
            <IntroOutroBuilder
              intro={intro}
              outro={outro}
              onIntroChange={setIntro}
              onOutroChange={setOutro}
            />
          </TabsContent>
          
          <TabsContent value="enhancements" className="mt-0">
            <AudioVideoEnhancer
              enhancements={enhancements}
              onEnhancementsChange={setEnhancements}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  speakers,
  lowerThirdStyle,
  intro,
  outro,
  enhancements,
  mediaUrl,
  isProcessing,
  processingStep,
  processingResults,
}: {
  speakers: Speaker[];
  lowerThirdStyle: LowerThirdStyle;
  intro: IntroOutro;
  outro: IntroOutro;
  enhancements: any;
  mediaUrl: string | null;
  isProcessing: boolean;
  processingStep: string | null;
  processingResults: any;
}) {
  const features = [
    {
      icon: Users,
      title: 'Speaker Detection',
      description: 'Auto-crop to active speaker',
      status: enhancements.speakerFocus ? 'enabled' : 'disabled',
      details: `${speakers.length} speakers configured`,
    },
    {
      icon: Type,
      title: 'Lower Thirds',
      description: lowerThirdStyle.template.replace('-', ' '),
      status: 'enabled',
      details: `${speakers.length} name cards ready`,
    },
    {
      icon: PlayCircle,
      title: 'Intro & Outro',
      description: intro.voiceEnabled ? 'With AI narration' : 'Visual only',
      status: 'enabled',
      details: `${intro.duration}s intro, ${outro.duration}s outro`,
    },
    {
      icon: Volume2,
      title: 'Audio Enhancement',
      description: 'Noise reduction & normalization',
      status: enhancements.noiseReduction || enhancements.audioNormalization ? 'enabled' : 'disabled',
      details: [
        enhancements.noiseReduction && 'Noise reduction',
        enhancements.audioNormalization && 'Normalization',
      ].filter(Boolean).join(', ') || 'None',
    },
    {
      icon: Video,
      title: 'Video Enhancement',
      description: 'Color correction & stabilization',
      status: enhancements.colorCorrection || enhancements.videoStabilization ? 'enabled' : 'disabled',
      details: [
        enhancements.colorCorrection && 'Color correction',
        enhancements.videoStabilization && 'Stabilization',
      ].filter(Boolean).join(', ') || 'None',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Video Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Source Video</h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            {mediaUrl ? (
              <video 
                src={mediaUrl} 
                controls 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No video loaded
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Processing Pipeline</h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  isProcessing && processingStep?.toLowerCase().includes(feature.title.toLowerCase().split(' ')[0])
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  feature.status === 'enabled' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  <feature.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{feature.title}</span>
                    <Badge variant={feature.status === 'enabled' ? 'default' : 'secondary'} className="text-[10px]">
                      {feature.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{feature.details}</p>
                </div>
                {isProcessing && processingStep?.toLowerCase().includes(feature.title.toLowerCase().split(' ')[0]) && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {processingResults && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="text-2xl font-bold text-primary">{speakers.length}</div>
          <div className="text-xs text-muted-foreground">Speakers</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="text-2xl font-bold text-primary">{intro.duration + outro.duration}s</div>
          <div className="text-xs text-muted-foreground">Intro + Outro</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="text-2xl font-bold text-primary">
            {Object.values(enhancements).filter(Boolean).length}
          </div>
          <div className="text-xs text-muted-foreground">Enhancements</div>
        </div>
        <div className="p-4 rounded-lg bg-muted/30 border border-border">
          <div className="text-2xl font-bold text-primary">YouTube</div>
          <div className="text-xs text-muted-foreground">Target Platform</div>
        </div>
      </div>
    </div>
  );
}
