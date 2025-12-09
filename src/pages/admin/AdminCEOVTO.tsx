import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Target, 
  Rocket, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Mic,
  Video,
  Sparkles,
  Shield,
  Globe,
  BarChart3,
  Eye,
  Gauge
} from 'lucide-react';
import { VTOCoreValues } from '@/components/vto/VTOCoreValues';
import { VTOCoreFocus } from '@/components/vto/VTOCoreFocus';
import { VTOTenYearTarget } from '@/components/vto/VTOTenYearTarget';
import { VTOMarketingStrategy } from '@/components/vto/VTOMarketingStrategy';
import { VTOThreeYearPicture } from '@/components/vto/VTOThreeYearPicture';
import { VTOOneYearPlan } from '@/components/vto/VTOOneYearPlan';
import { VTORocks } from '@/components/vto/VTORocks';
import { VTOIssues } from '@/components/vto/VTOIssues';
import { VTOCEOAdjustments } from '@/components/vto/VTOCEOAdjustments';
import { VTOCEOInsightPanel } from '@/components/vto/VTOCEOInsightPanel';
import { VTOExportControls } from '@/components/vto/VTOExportControls';
import { VTOData } from '@/types/vto';

const AdminCEOVTO = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();

  // VTO State
  const [vtoData, setVtoData] = useState<VTOData>({
    coreValues: [
      { id: '1', value: 'Authenticity First' },
      { id: '2', value: 'Creator Empowerment' },
      { id: '3', value: 'Ethical AI' },
      { id: '4', value: 'Continuous Innovation' },
    ],
    coreFocus: {
      purpose: 'To empower creators to share their authentic voice with the world, eliminating the technical barriers that stand between raw ideas and polished content.',
      niche: 'AI-powered content refinement and repurposing for podcasters and video creators',
    },
    tenYearTarget: {
      target: '$100M ARR',
      description: 'Alchify is the go-to platform for every serious content creator, processing 1 billion minutes of content annually and saving creators 100 million hours of editing time.',
    },
    marketingStrategy: {
      targetMarket: 'Independent podcasters and video creators with 10K-500K audience, seeking to scale content output without scaling effort',
      threeUniques: [
        'Refiner AI: Context-aware assistant that learns your style',
        'Authenticity Layer: No deepfakes, full transparency',
        'One platform to replace 10+ tools',
      ],
      provenProcess: 'The Alchify Method™: Upload → Refine → Distribute',
      guarantee: 'Save 6+ hours per episode or your money back',
    },
    threeYearPicture: {
      revenue: '$5M ARR',
      profit: '$1M EBITDA',
      teamSize: '25 people',
      keyMetrics: 'NPS 70+, Churn < 5%, 50K active creators',
      productMilestones: 'Mobile app, API access, Enterprise tier, 10+ integrations',
      successNarrative: 'Alchify is recognized as the industry standard for creator content refinement. Top podcasters and YouTubers credit Alchify for their content consistency and output growth. The platform has expanded beyond individual creators to agencies and media companies.',
    },
    oneYearPlan: {
      revenueTarget: '$1.2M ARR',
      profitTarget: '$200K',
      priorities: [
        'Launch paid tiers and reach 5K paying subscribers',
        'Complete Creatomate integration for professional clips',
        'Build enterprise tier with SSO and team features',
        'Establish 3 major creator partnerships',
        'Launch mobile companion app',
      ],
    },
    rocks: [
      { id: '1', title: 'Fix caption rendering in clips', owner: 'Engineering', dueQuarter: 'Q1', status: 'in_progress' },
      { id: '2', title: 'Launch Stripe payment processing', owner: 'Product', dueQuarter: 'Q1', status: 'not_started' },
      { id: '3', title: 'Sign 10 beta creator partnerships', owner: 'Growth', dueQuarter: 'Q1', status: 'in_progress' },
      { id: '4', title: 'Complete multi-track timeline editor', owner: 'Engineering', dueQuarter: 'Q1', status: 'not_started' },
    ],
    issues: [
      { id: '1', title: 'Creatomate captions not rendering', priority: 'high', forL10: true },
      { id: '2', title: 'Large file transcription failures (>25MB)', priority: 'high', forL10: true },
      { id: '3', title: 'Need legal review of ToS', priority: 'medium', forL10: false },
      { id: '4', title: 'Competitor Opus Clips gaining market share', priority: 'medium', forL10: true },
    ],
    ceoAdjustments: {
      visionClarity: 8,
      teamAlignment: 7,
      executionConfidence: 65,
      quarterlyFocusLevel: 5,
      riskLevel: 'medium',
    },
  });

  const updateVTO = <K extends keyof VTOData>(key: K, value: VTOData[K]) => {
    setVtoData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // In production, this would save to database
    console.log('Saving VTO:', vtoData);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  // Calculate current quarter dynamically
  const getCurrentQuarter = () => {
    const now = new Date();
    const month = now.getMonth(); // 0-11
    const year = now.getFullYear();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${year}`;
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="mb-2">EOS Vision/Traction Organizer</Badge>
          <h1 className="text-4xl font-bold">Alchify CEO VTO</h1>
          <p className="text-sm text-muted-foreground">{getCurrentQuarter()} Strategic Planning</p>
        </div>

        {/* SECTION 2: Vision Components */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Vision (Long-Term Strategy)</h2>
          </div>
          <Separator />
        </div>

        <VTOCoreValues 
          values={vtoData.coreValues} 
          onChange={(values) => updateVTO('coreValues', values)} 
        />

        <VTOCoreFocus 
          coreFocus={vtoData.coreFocus} 
          onChange={(focus) => updateVTO('coreFocus', focus)} 
        />

        <VTOTenYearTarget 
          target={vtoData.tenYearTarget} 
          onChange={(target) => updateVTO('tenYearTarget', target)} 
        />

        <VTOMarketingStrategy 
          strategy={vtoData.marketingStrategy} 
          onChange={(strategy) => updateVTO('marketingStrategy', strategy)} 
        />

        <VTOThreeYearPicture 
          picture={vtoData.threeYearPicture} 
          onChange={(picture) => updateVTO('threeYearPicture', picture)} 
        />

        {/* CEO Overview - Existing Content */}
        <div className="space-y-2 mt-12">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">CEO Overview</h2>
          </div>
          <Separator />
        </div>

        {/* Market Opportunity */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Market Opportunity</CardTitle>
            </div>
            <CardDescription>The Creator Economy is Exploding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">$250B+</div>
                <div className="text-sm text-muted-foreground">Creator Economy Size (2024)</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">200M+</div>
                <div className="text-sm text-muted-foreground">Active Content Creators</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">$4B</div>
                <div className="text-sm text-muted-foreground">Podcast Industry Revenue</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Podcast Growth</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 500M+ podcast listeners globally</li>
                  <li>• 5M+ active podcasts worldwide</li>
                  <li>• 23% YoY growth in podcast advertising</li>
                  <li>• Average creator spends 6+ hours on post-production</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">Creator Pain Points</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 73% struggle with content repurposing</li>
                  <li>• 68% cite editing as biggest time sink</li>
                  <li>• 45% have experienced content theft</li>
                  <li>• Average 10+ tools in creator tech stack</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MVP Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>MVP Summary: The Crucible for Creators</CardTitle>
            </div>
            <CardDescription>Alchify transforms raw content into polished, platform-ready assets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Core Features (Live)
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    Recording Studio with multi-destination streaming
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Auto-Alchify: Instant AI transcription & enhancement
                  </li>
                  <li className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    AI Clip Generator with animated captions
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Authenticity Layer: No deepfakes, full transparency
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-500" />
                  Key Differentiators
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    <span><strong>Refiner AI:</strong> Context-aware assistant guides creators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    <span><strong>Alchify's Way:</strong> Ethical AI code of conduct</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    <span><strong>Zero-Scroll UX:</strong> Everything accessible without scrolling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-primary mt-0.5" />
                    <span><strong>Tool Consolidation:</strong> Replace 10+ tools with one platform</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <Separator />
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">MVP Value Proposition</h4>
              <p className="text-sm text-muted-foreground">
                Alchify reduces post-production time by <strong>75%</strong>, automates content repurposing across 
                <strong> 4+ platforms</strong>, and protects creator IP with blockchain-ready metadata embedding. 
                Average creator saves <strong>6+ hours per episode</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Technology Stack</CardTitle>
            </div>
            <CardDescription>Modern, scalable architecture built for growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold text-primary">Frontend</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• React 18 + TypeScript</li>
                  <li>• Vite (fast builds)</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• TanStack Query (data fetching)</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold text-primary">Backend (Lovable Cloud)</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Supabase (PostgreSQL)</li>
                  <li>• Edge Functions (Deno)</li>
                  <li>• Row-Level Security</li>
                  <li>• Real-time subscriptions</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-semibold text-primary">AI & Media</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• OpenAI Whisper (transcription)</li>
                  <li>• Google Gemini 2.5 Flash (AI)</li>
                  <li>• Creatomate (video rendering)</li>
                  <li>• ElevenLabs (audio - planned)</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Infrastructure Ready for Scale</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Current architecture supports 10K+ concurrent users with horizontal scaling via Supabase.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* GTM Strategy */}
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <CardTitle>Go-To-Market Strategy</CardTitle>
            </div>
            <CardDescription>Phased approach to market capture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Phase 1 */}
            <div className="border-l-4 border-primary pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge>Phase 1: Q1 2025</Badge>
                <span className="font-semibold">Creator Beta Launch</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Target: 500 beta creators (podcasters & YouTubers)</li>
                <li>• Influencer partnerships with mid-tier creators (100K-500K followers)</li>
                <li>• Content marketing: "Alchify Your Voice" campaign</li>
                <li>• Community building on Discord + Twitter/X</li>
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="border-l-4 border-amber-500 pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Phase 2: Q2 2025</Badge>
                <span className="font-semibold">Paid Launch & Expansion</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Launch 7-tier pricing ($0-$2000+/month)</li>
                <li>• Target: 5,000 paying subscribers</li>
                <li>• YouTube creator program partnerships</li>
                <li>• Podcast network integrations (Spotify, Apple)</li>
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="border-l-4 border-muted pl-4 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Phase 3: Q3-Q4 2025</Badge>
                <span className="font-semibold">Enterprise & Agency</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• White-label solutions for agencies</li>
                <li>• Enterprise tier with SSO, API access</li>
                <li>• Media company partnerships</li>
                <li>• International expansion (LATAM, EU)</li>
              </ul>
            </div>

            <Separator />

            {/* Revenue Projections */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-2xl font-bold">$150K</div>
                <div className="text-xs text-muted-foreground">ARR Target (Q2 2025)</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-2xl font-bold">5,000</div>
                <div className="text-xs text-muted-foreground">Paid Users (Q2 2025)</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <Globe className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-2xl font-bold">$1.2M</div>
                <div className="text-xs text-muted-foreground">ARR Target (Q4 2025)</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
                <div className="text-2xl font-bold">25K</div>
                <div className="text-xs text-muted-foreground">Users (Q4 2025)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 3: Traction Components */}
        <div className="space-y-2 mt-12">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">Traction (Execution Framework)</h2>
          </div>
          <Separator />
        </div>

        <VTOOneYearPlan 
          plan={vtoData.oneYearPlan} 
          onChange={(plan) => updateVTO('oneYearPlan', plan)} 
        />

        <VTORocks 
          rocks={vtoData.rocks} 
          onChange={(rocks) => updateVTO('rocks', rocks)} 
        />

        <VTOIssues 
          issues={vtoData.issues} 
          onChange={(issues) => updateVTO('issues', issues)} 
        />

        {/* Next Steps - From Original */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Immediate Next Steps</CardTitle>
            </div>
            <CardDescription>Critical path to launch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold">Technical (Next 30 Days)</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    Fix Creatomate caption rendering issue
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Complete ElevenLabs audio integration
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Implement Stripe payment processing
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Deploy multi-track timeline editor
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">Business (Next 30 Days)</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Finalize beta creator partnerships (10 signed)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                    Complete legal/terms of service
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Launch landing page with waitlist
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Set up creator community Discord
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 4: CEO Adjustment Controls */}
        <div className="space-y-2 mt-12">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">CEO Controls & Insights</h2>
          </div>
          <Separator />
        </div>

        <VTOCEOAdjustments 
          adjustments={vtoData.ceoAdjustments} 
          onChange={(adjustments) => updateVTO('ceoAdjustments', adjustments)} 
        />

        <VTOCEOInsightPanel 
          adjustments={vtoData.ceoAdjustments} 
          data={vtoData} 
        />

        {/* The Ask */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-center">The Ask</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">$500K Seed Round</div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              18-month runway to reach $1.2M ARR, 25K users, and Series A readiness.
              Funds allocated: 50% Engineering, 30% Marketing/Sales, 20% Operations.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Badge variant="outline" className="text-lg px-4 py-2">Pre-Seed Valued: $3M</Badge>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 5: Export Controls */}
        <VTOExportControls onSave={handleSave} />

        <div className="text-center text-sm text-muted-foreground pb-8">
          <p>Confidential - For Board Review Only</p>
          <p>Alchify Inc. • The Crucible for Creators</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminCEOVTO;
