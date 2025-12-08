import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Wrench,
  Database,
  Cloud,
  Video,
  Mic,
  Wand2,
  CreditCard,
  Shield,
  Globe
} from 'lucide-react';

interface TechItem {
  name: string;
  description: string;
  status: 'active' | 'partial' | 'needs-work' | 'planned';
  category: string;
  notes: string[];
}

const techStack: TechItem[] = [
  // Frontend
  {
    name: 'React 18 + TypeScript',
    description: 'Core frontend framework with type safety',
    status: 'active',
    category: 'Frontend',
    notes: ['Vite for build tooling', 'React Router for navigation', 'Full TypeScript coverage']
  },
  {
    name: 'Tailwind CSS + shadcn/ui',
    description: 'Styling and component library',
    status: 'active',
    category: 'Frontend',
    notes: ['Custom design system with CSS variables', 'Dark/Light/Auto theme support', 'Responsive design']
  },
  {
    name: 'TanStack React Query',
    description: 'Server state management and caching',
    status: 'active',
    category: 'Frontend',
    notes: ['Used for Supabase data fetching', 'Automatic cache invalidation']
  },

  // Backend & Database
  {
    name: 'Supabase (Lovable Cloud)',
    description: 'Backend-as-a-Service platform',
    status: 'active',
    category: 'Backend',
    notes: [
      'PostgreSQL database',
      'Row Level Security (RLS) enabled',
      'Edge Functions for serverless logic',
      'Real-time subscriptions available'
    ]
  },
  {
    name: 'Supabase Auth',
    description: 'User authentication system',
    status: 'active',
    category: 'Backend',
    notes: ['Email/password auth', 'Google OAuth ready', 'Auto-confirm enabled for dev']
  },
  {
    name: 'Supabase Storage',
    description: 'File storage for media and avatars',
    status: 'active',
    category: 'Backend',
    notes: [
      'media-uploads bucket (private) - for project files',
      'avatars bucket (public) - for user avatars',
      'RLS policies configured'
    ]
  },

  // AI & Processing
  {
    name: 'OpenAI Whisper (Transcription)',
    description: 'Speech-to-text via transcribe-audio edge function',
    status: 'active',
    category: 'AI Processing',
    notes: [
      'Word-level timestamps enabled',
      'Filler word detection',
      'Confidence scoring',
      'OPENAI_API_KEY configured'
    ]
  },
  {
    name: 'Google Gemini 2.5 Flash (Clip Generation)',
    description: 'AI clip suggestions via generate-clips edge function',
    status: 'active',
    category: 'AI Processing',
    notes: [
      'Analyzes transcripts for viral moments',
      'Suggests 3-5 clips per project',
      'Generates hooks and engagement scores',
      'Uses LOVABLE_API_KEY'
    ]
  },
  {
    name: 'Shotstack API (Video Rendering)',
    description: 'Cloud video rendering for clips with captions',
    status: 'partial',
    category: 'AI Processing',
    notes: [
      'Edge function created (render-clip)',
      'SHOTSTACK_API_KEY configured',
      'Platform presets: TikTok, Reels, Shorts, Landscape',
      'NEEDS: Wire up UI to trigger renders and download MP4s'
    ]
  },
  {
    name: 'ElevenLabs (Audio Enhancement)',
    description: 'AI audio cleanup and enhancement',
    status: 'planned',
    category: 'AI Processing',
    notes: [
      'ELEVENLABS_API_KEY configured',
      'NEEDS: Create edge function for audio processing',
      'NEEDS: Integrate into Post Production pipeline'
    ]
  },

  // Recording & Streaming
  {
    name: 'WebRTC Recording',
    description: 'Browser-based video/audio recording',
    status: 'active',
    category: 'Recording',
    notes: [
      'Webcam + screen capture',
      'MediaRecorder API for encoding',
      'Downloads as .webm locally',
      'NEEDS: Save directly to Supabase Storage'
    ]
  },
  {
    name: 'Streaming (RTMP)',
    description: 'Live streaming to social platforms',
    status: 'needs-work',
    category: 'Recording',
    notes: [
      'UI mockup exists for Facebook, LinkedIn, YouTube',
      'NEEDS: RTMP server integration',
      'NEEDS: Platform OAuth for direct streaming'
    ]
  },

  // Payments & Subscriptions
  {
    name: 'Stripe Integration',
    description: 'Payment processing for subscriptions',
    status: 'needs-work',
    category: 'Payments',
    notes: [
      'Pricing plans in database',
      'User subscriptions table exists',
      'NEEDS: Stripe SDK integration',
      'NEEDS: Checkout flow',
      'NEEDS: Webhook handler for subscription events'
    ]
  },

  // Social Integrations
  {
    name: 'YouTube Integration',
    description: 'OAuth and upload capabilities',
    status: 'needs-work',
    category: 'Integrations',
    notes: [
      'user_integrations table ready',
      'NEEDS: YouTube OAuth flow',
      'NEEDS: Upload API integration'
    ]
  },
  {
    name: 'TikTok Integration',
    description: 'OAuth and upload capabilities',
    status: 'planned',
    category: 'Integrations',
    notes: ['NEEDS: TikTok Developer account', 'NEEDS: OAuth flow', 'NEEDS: Upload API']
  },
  {
    name: 'Instagram/Facebook Integration',
    description: 'OAuth and upload capabilities',
    status: 'planned',
    category: 'Integrations',
    notes: ['NEEDS: Meta Developer account', 'NEEDS: OAuth flow', 'NEEDS: Graph API integration']
  },

  // Admin & Security
  {
    name: 'Role-Based Access (RBAC)',
    description: 'Admin, Moderator, User roles',
    status: 'active',
    category: 'Security',
    notes: [
      'user_roles table with RLS',
      'has_role() function for checks',
      'Admin dashboard with stats',
      'User management panel'
    ]
  },
  {
    name: 'AI Action Logging',
    description: 'Transparency layer for AI operations',
    status: 'partial',
    category: 'Security',
    notes: [
      'ai_action_log table exists',
      'NEEDS: Log all AI actions consistently',
      'NEEDS: Display in project history'
    ]
  },
];

const statusConfig = {
  'active': { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircle },
  'partial': { label: 'Partial', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertCircle },
  'needs-work': { label: 'Needs Work', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Wrench },
  'planned': { label: 'Planned', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Clock },
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Frontend': Globe,
  'Backend': Database,
  'AI Processing': Wand2,
  'Recording': Video,
  'Payments': CreditCard,
  'Integrations': Cloud,
  'Security': Shield,
};

const AdminTechStack = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, loading, navigate]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) return null;

  const categories = [...new Set(techStack.map(item => item.category))];

  const statusSummary = {
    active: techStack.filter(t => t.status === 'active').length,
    partial: techStack.filter(t => t.status === 'partial').length,
    'needs-work': techStack.filter(t => t.status === 'needs-work').length,
    planned: techStack.filter(t => t.status === 'planned').length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tech Stack Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Overview of technologies, integrations, and development status — Last updated: December 8, 2024
          </p>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(statusSummary).map(([status, count]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const Icon = config.icon;
            return (
              <Card key={status} className="border-border">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Reference */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Quick Reference: Key API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><span className="font-medium text-green-400">✓ OPENAI_API_KEY</span> — Whisper transcription</p>
                <p><span className="font-medium text-green-400">✓ LOVABLE_API_KEY</span> — Gemini AI (clips)</p>
                <p><span className="font-medium text-green-400">✓ SHOTSTACK_API_KEY</span> — Video rendering</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium text-green-400">✓ ELEVENLABS_API_KEY</span> — Audio (not wired)</p>
                <p><span className="font-medium text-yellow-400">○ STRIPE_SECRET_KEY</span> — Not configured</p>
                <p><span className="font-medium text-yellow-400">○ Social OAuth</span> — Not configured</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tech by Category */}
        {categories.map(category => {
          const CategoryIcon = categoryIcons[category] || Database;
          const items = techStack.filter(item => item.category === category);
          
          return (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <CategoryIcon className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{category}</h2>
                <Badge variant="outline" className="ml-2">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {items.map(item => {
                  const config = statusConfig[item.status];
                  const StatusIcon = config.icon;
                  
                  return (
                    <Card key={item.name} className="border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription>{item.description}</CardDescription>
                          </div>
                          <Badge className={`${config.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1">
                          {item.notes.map((note, idx) => (
                            <li key={idx} className={`flex items-start gap-2 ${note.startsWith('NEEDS:') ? 'text-orange-400' : 'text-muted-foreground'}`}>
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-current flex-shrink-0" />
                              {note}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Priority Actions */}
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-lg text-orange-400">Priority Actions for Full Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li><strong>Wire Shotstack rendering</strong> — Connect UI to render-clip edge function for MP4 exports</li>
              <li><strong>Save recordings to cloud</strong> — Upload Recording Studio .webm files to Supabase Storage</li>
              <li><strong>Stripe checkout</strong> — Implement payment flow for plan upgrades</li>
              <li><strong>ElevenLabs audio</strong> — Create edge function for noise reduction/enhancement</li>
              <li><strong>YouTube OAuth</strong> — Enable direct upload from Exports page</li>
              <li><strong>AI Action Logging</strong> — Ensure all AI operations are logged for transparency</li>
            </ol>
          </CardContent>
        </Card>

        {/* Edge Functions Reference */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Edge Functions Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-green-400">transcribe-audio</p>
                <p className="text-muted-foreground mt-1">OpenAI Whisper with word timestamps</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-green-400">generate-clips</p>
                <p className="text-muted-foreground mt-1">Gemini 2.5 Flash for viral clips</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium text-yellow-400">render-clip</p>
                <p className="text-muted-foreground mt-1">Shotstack video rendering (needs UI)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AdminTechStack;
