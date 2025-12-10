import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Upload, 
  FolderOpen, 
  Clock, 
  Sparkles,
  Plus,
  ArrowRight,
  Wand2,
  BarChart3,
  Video,
  Music,
  Loader2,
  PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { UsageIndicator } from '@/components/UsageIndicator';
import { DailyBriefButton } from '@/components/briefs/DailyBriefButton';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreatorInsights, CreatorMetrics } from '@/hooks/useCreatorInsights';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { ProcessingHighlightCard } from '@/components/dashboard/ProcessingHighlightCard';
import { InsightOfTheDay } from '@/components/dashboard/InsightOfTheDay';
import { DeepDiveCard } from '@/components/dashboard/DeepDiveCard';
import { GreetingHeader } from '@/components/dashboard/GreetingHeader';

interface Project {
  id: string;
  title: string;
  status: string;
  source_file_type: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  // Demo metrics for presentation (in production, these come from actual data)
  const creatorMetrics: CreatorMetrics = useMemo(() => ({
    timeSavedHours: projectCount > 0 ? projectCount * 0.7 : 0,
    projectCount,
    exportsCount: projectCount > 0 ? Math.floor(projectCount * 1.5) : 0,
    avgAccuracy: projectCount > 0 ? 96.2 : 0,
    fillersRemoved: projectCount > 0 ? 47 : 0,
    pausesCut: projectCount > 0 ? 12 : 0,
    audioEnhancedPercent: projectCount > 0 ? 18 : 0,
    clipsCreated: projectCount > 0 ? 5 : 0,
    wordsTranscribed: projectCount > 0 ? 2400 : 0,
    captionsSynced: projectCount > 0 ? 8 : 0,
  }), [projectCount]);

  const { 
    insights, 
    insightOfTheDay, 
    isLoading: insightsLoading,
    getInsightForMetric,
    generateDeepDive,
    isGeneratingDeepDive
  } = useCreatorInsights(creatorMetrics);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRecentProjects();
    }
  }, [user]);

  // Check for celebration triggers and welcome message from URL params
  useEffect(() => {
    const celebration = searchParams.get('celebration');
    const welcome = searchParams.get('welcome');
    
    if (welcome === 'true') {
      setShowWelcomeDialog(true);
      searchParams.delete('welcome');
      setSearchParams(searchParams, { replace: true });
    }
    
    if (celebration === 'first-upload') {
      triggerCelebration('Congrats! You uploaded your first project! 🎉');
      searchParams.delete('celebration');
      setSearchParams(searchParams, { replace: true });
    } else if (celebration === 'first-clip') {
      triggerCelebration('Amazing! Your first clip is ready! 🎬');
      searchParams.delete('celebration');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams]);

  const triggerCelebration = (message: string) => {
    setCelebrationMessage(message);
    setShowCelebration(true);
    
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#f59e0b', '#8b5cf6', '#22c55e', '#3b82f6', '#ec4899'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors
    });

    setTimeout(() => {
      setShowCelebration(false);
    }, 5000);
  };

  const fetchRecentProjects = async () => {
    try {
      const { data, error, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(6);
      
      if (error) throw error;
      setRecentProjects(data || []);
      setProjectCount(count || 0);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats with insights
  const timeSaved = projectCount > 0 ? `${(projectCount * 0.7).toFixed(1)} hrs` : '0 hrs';
  const exportsCount = projectCount > 0 ? Math.floor(projectCount * 1.5) : 0;
  const avgAccuracy = projectCount > 0 ? '96.2%' : '—';
  
  const stats = [
    { 
      label: 'Time Saved', 
      value: timeSaved, 
      icon: Clock, 
      subtext: 'vs manual editing',
      insightKey: 'Time Saved'
    },
    { 
      label: 'Projects', 
      value: projectCount.toString(), 
      icon: FolderOpen, 
      subtext: 'total uploads',
      insightKey: 'Projects'
    },
    { 
      label: 'Exports', 
      value: exportsCount.toString(), 
      icon: Wand2, 
      subtext: 'clips created',
      insightKey: 'Exports'
    },
    { 
      label: 'Avg Accuracy', 
      value: avgAccuracy, 
      icon: BarChart3, 
      subtext: 'transcription',
      insightKey: 'Avg Accuracy'
    },
  ];

  // Processing highlights with insights
  const processingHighlights = [
    { 
      label: 'Fillers Removed', 
      value: '47', 
      colorClass: 'from-accent/10 to-transparent border border-accent/20 text-accent',
      insightKey: 'Fillers Removed'
    },
    { 
      label: 'Pauses Cut', 
      value: '12', 
      colorClass: 'from-green-500/10 to-transparent border border-green-500/20 text-green-500',
      insightKey: 'Pauses Cut'
    },
    { 
      label: 'Audio Enhanced', 
      value: '18%', 
      colorClass: 'from-blue-500/10 to-transparent border border-blue-500/20 text-blue-500',
      insightKey: 'Audio Enhanced'
    },
    { 
      label: 'Clips Created', 
      value: '5', 
      colorClass: 'from-purple-500/10 to-transparent border border-purple-500/20 text-purple-500',
      insightKey: 'Clips Created'
    },
    { 
      label: 'Words Transcribed', 
      value: '2.4k', 
      colorClass: 'from-yellow-500/10 to-transparent border border-yellow-500/20 text-yellow-500',
      insightKey: 'Words Transcribed'
    },
    { 
      label: 'Captions Synced', 
      value: '8', 
      colorClass: 'from-pink-500/10 to-transparent border border-pink-500/20 text-pink-500',
      insightKey: 'Captions Synced'
    },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Alchify</title>
        <meta name="description" content="Your Alchify dashboard - manage projects, upload content, and refine your media." />
      </Helmet>
      
      <AppLayout>
        {/* Welcome Back Dialog */}
        <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Welcome back!
              </DialogTitle>
              <DialogDescription className="text-center">
                You have successfully signed in. Ready to create something amazing?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center pt-2">
              <Button onClick={() => setShowWelcomeDialog(false)} variant="default">
                Let's go
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Celebration Banner */}
        {showCelebration && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
              <PartyPopper className="h-6 w-6 animate-bounce" />
              <span className="text-lg font-bold">{celebrationMessage}</span>
              <PartyPopper className="h-6 w-6 animate-bounce" />
            </div>
          </div>
        )}

        {/* Greeting Header with Avatar and Weather */}
        <div className="flex items-start justify-between">
          <GreetingHeader />
          <DailyBriefButton />
        </div>

        {/* Insight of the Day + Deep Dive Side by Side */}
        {projectCount > 0 && (
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <InsightOfTheDay 
              insight={insightOfTheDay} 
              isLoading={insightsLoading} 
            />
            <DeepDiveCard 
              onGenerateReport={generateDeepDive}
              isGenerating={isGeneratingDeepDive}
            />
          </div>
        )}
        
        {/* Quick Stats with Click-Activated Insights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat) => (
            <MetricCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              subtext={stat.subtext}
              passiveInsight={getInsightForMetric(stat.insightKey)?.passiveInsight}
              insight={getInsightForMetric(stat.insightKey)}
            />
          ))}
        </div>
        
        {/* Processing Highlights with Click-Activated Insights */}
        {projectCount > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
            {processingHighlights.map((highlight) => (
              <ProcessingHighlightCard
                key={highlight.label}
                label={highlight.label}
                value={highlight.value}
                colorClass={highlight.colorClass}
                passiveInsight={getInsightForMetric(highlight.insightKey)?.passiveInsight}
                insight={getInsightForMetric(highlight.insightKey)}
              />
            ))}
          </div>
        )}
        
        {/* Unified Upload + Recent Projects Section */}
        <div className="bg-gradient-to-br from-card via-card to-card/50 border border-border hover:border-primary/20 rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-background/50 mb-6">
          {/* Upload CTA at top */}
          <Link 
            to="/upload"
            className="group relative overflow-hidden rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all duration-300 block mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/30 transition-colors duration-500" />
            
            <div className="relative z-10 p-5 flex items-center gap-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                  Upload New Content
                </h2>
                <p className="text-sm text-muted-foreground">
                  Drop raw video or audio files to transcribe, clean up, and create clips.
                </p>
              </div>
              <Button 
                className="shrink-0 bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-primary/25 hover:shadow-xl group-hover:scale-105 transition-all duration-300 pointer-events-none"
                size="lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </Link>
          
          {/* Recent Projects below */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Recent Projects</h3>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10 font-medium" asChild>
              <Link to="/projects">View All</Link>
            </Button>
          </div>
          
          {loadingProjects ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentProjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center bg-muted/20 rounded-xl border border-dashed border-border">
              <div className="p-3 rounded-full bg-muted/50 mb-3">
                <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">No projects yet</p>
              <p className="text-muted-foreground/70 text-xs">Upload content to get started</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {recentProjects.slice(0, 6).map((project, index) => (
                <Link
                  key={project.id}
                  to={`/refiner/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all duration-200 group/item animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 group-hover/item:from-primary/25 transition-colors">
                    {project.source_file_type === 'video' ? (
                      <Video className="h-4 w-4 text-primary" />
                    ) : (
                      <Music className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover/item:text-primary transition-colors">{project.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(project.created_at)}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {/* Usage, Revive & Deep Dive Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Usage Indicator */}
          <UsageIndicator />
          
          {/* Revive Content Section */}
          <div className="bg-card/30 border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Revive Your Content</h3>
                <p className="text-sm text-muted-foreground">
                  Suggestions based on your content library
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">
                Upload content to get personalized suggestions
              </p>
            </div>
          </div>
        </div>

      </AppLayout>
    </>
  );
};

export default Dashboard;
