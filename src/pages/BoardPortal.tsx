import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Rocket, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Eye,
  Gauge,
  Heart,
  Crosshair,
  Calendar,
  Flag,
  AlertCircle,
  Download,
  Share2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BoardPortal = () => {
  const { toast } = useToast();
  const [lastUpdated] = useState(new Date().toLocaleDateString());

  // Static VTO data for board view (in production, this would be fetched based on shared version)
  const vtoData = {
    coreValues: ['Authenticity First', 'Creator Empowerment', 'Ethical AI', 'Continuous Innovation'],
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
      { title: 'Fix caption rendering in clips', owner: 'Engineering', status: 'in_progress' },
      { title: 'Launch Stripe payment processing', owner: 'Product', status: 'not_started' },
      { title: 'Sign 10 beta creator partnerships', owner: 'Growth', status: 'in_progress' },
      { title: 'Complete multi-track timeline editor', owner: 'Engineering', status: 'not_started' },
    ],
    issues: [
      { title: 'Creatomate captions not rendering', priority: 'high' },
      { title: 'Large file transcription failures (>25MB)', priority: 'high' },
      { title: 'Need legal review of ToS', priority: 'medium' },
      { title: 'Competitor Opus Clips gaining market share', priority: 'medium' },
    ],
  };

  const handleDownloadPDF = () => {
    toast({
      title: 'Generating PDF',
      description: 'Your board presentation is being prepared...',
    });
    // In production, this would trigger PDF generation
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link Copied',
      description: 'Board portal link copied to clipboard',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Complete</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Board Portal | Alchify VTO</title>
        <meta name="description" content="Alchify Vision/Traction Organizer - Board Member View" />
      </Helmet>

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Alchify Board Portal</h1>
              <p className="text-xs text-muted-foreground">Vision/Traction Organizer</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Title Section */}
        <div className="text-center mb-8">
          <Badge variant="outline" className="mb-3">Q4 2025 Strategic Planning</Badge>
          <h2 className="text-3xl font-bold mb-2">Alchify CEO VTO</h2>
          <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
        </div>

        {/* Vision Section */}
        <section className="space-y-6 mb-10">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold">Vision</h3>
          </div>
          <Separator />

          {/* Core Values */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-4 w-4 text-primary" />
                Core Values
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {vtoData.coreValues.map((value, index) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {value}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Core Focus */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Crosshair className="h-4 w-4 text-primary" />
                Core Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Purpose / Cause / Passion</p>
                <p className="text-sm">{vtoData.coreFocus.purpose}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Our Niche</p>
                <p className="text-sm">{vtoData.coreFocus.niche}</p>
              </div>
            </CardContent>
          </Card>

          {/* 10-Year Target */}
          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-4 w-4 text-primary" />
                10-Year Target (BHAG)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary mb-2">{vtoData.tenYearTarget.target}</p>
              <p className="text-sm text-muted-foreground">{vtoData.tenYearTarget.description}</p>
            </CardContent>
          </Card>

          {/* Marketing Strategy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Rocket className="h-4 w-4 text-primary" />
                Marketing Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target Market</p>
                <p className="text-sm">{vtoData.marketingStrategy.targetMarket}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Three Uniques™</p>
                <ul className="space-y-1">
                  {vtoData.marketingStrategy.threeUniques.map((unique, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {unique}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Proven Process</p>
                  <p className="text-sm font-medium">{vtoData.marketingStrategy.provenProcess}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Guarantee</p>
                  <p className="text-sm font-medium">{vtoData.marketingStrategy.guarantee}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3-Year Picture */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-primary" />
                3-Year Picture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <DollarSign className="h-5 w-5 mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold">{vtoData.threeYearPicture.revenue}</p>
                  <p className="text-xs text-muted-foreground">Revenue</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <TrendingUp className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold">{vtoData.threeYearPicture.profit}</p>
                  <p className="text-xs text-muted-foreground">Profit</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Users className="h-5 w-5 mx-auto text-purple-500 mb-1" />
                  <p className="text-lg font-bold">{vtoData.threeYearPicture.teamSize}</p>
                  <p className="text-xs text-muted-foreground">Team</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Gauge className="h-5 w-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-sm font-bold">{vtoData.threeYearPicture.keyMetrics}</p>
                  <p className="text-xs text-muted-foreground">Key Metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Traction Section */}
        <section className="space-y-6 mb-10">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold">Traction</h3>
          </div>
          <Separator />

          {/* 1-Year Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-4 w-4 text-primary" />
                1-Year Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Revenue Target</p>
                  <p className="text-xl font-bold text-green-600">{vtoData.oneYearPlan.revenueTarget}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground mb-1">Profit Target</p>
                  <p className="text-xl font-bold text-blue-600">{vtoData.oneYearPlan.profitTarget}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Key Priorities</p>
                <ul className="space-y-2">
                  {vtoData.oneYearPlan.priorities.map((priority, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      {priority}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quarterly Rocks */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Flag className="h-4 w-4 text-primary" />
                Quarterly Rocks
              </CardTitle>
              <CardDescription>Q1 2025 Focus Areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vtoData.rocks.map((rock, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="font-medium text-sm">{rock.title}</p>
                      <p className="text-xs text-muted-foreground">{rock.owner}</p>
                    </div>
                    {getStatusBadge(rock.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-4 w-4 text-primary" />
                Issues List
              </CardTitle>
              <CardDescription>Items requiring discussion</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vtoData.issues.map((issue, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <p className="font-medium text-sm">{issue.title}</p>
                    {getPriorityBadge(issue.priority)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* The Ask Section */}
        <section className="mb-10">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                The Ask
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600 mb-2">$500K Seed Round</p>
              <p className="text-muted-foreground">
                18-month runway to reach $1.2M ARR, 25K users, and Series A readiness.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="text-center py-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">
            Confidential - For Board Members Only
          </p>
          <Link to="/" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            Visit Alchify <ExternalLink className="h-3 w-3" />
          </Link>
        </footer>
      </main>
    </div>
  );
};

export default BoardPortal;
