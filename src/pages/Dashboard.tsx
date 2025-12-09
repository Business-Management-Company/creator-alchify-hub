import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { UsageIndicator } from '@/components/UsageIndicator';

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
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectCount, setProjectCount] = useState(0);
  const [loadingProjects, setLoadingProjects] = useState(true);

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

  // Demo stats for presentation
  const timeSaved = projectCount > 0 ? `${(projectCount * 0.7).toFixed(1)} hrs` : '0 hrs';
  const exportsCount = projectCount > 0 ? Math.floor(projectCount * 1.5) : 0;
  const avgAccuracy = projectCount > 0 ? '96.2%' : '—';
  
  const stats = [
    { label: 'Time Saved', value: timeSaved, icon: Clock, subtext: 'vs manual editing' },
    { label: 'Projects', value: projectCount.toString(), icon: FolderOpen, subtext: 'total uploads' },
    { label: 'Exports', value: exportsCount.toString(), icon: Wand2, subtext: 'clips created' },
    { label: 'Avg Accuracy', value: avgAccuracy, icon: BarChart3, subtext: 'transcription' },
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back{user.user_metadata?.display_name ? `, ${user.user_metadata.display_name}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Ready to refine some content? Upload something new or continue working on a project.
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div 
              key={stat.label}
              className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
            </div>
          ))}
        </div>
        
        {/* Processing Highlights - show when user has projects */}
        {projectCount > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-accent">47</div>
              <div className="text-xs text-muted-foreground">Fillers Removed</div>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-500">12</div>
              <div className="text-xs text-muted-foreground">Pauses Cut</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-500">18%</div>
              <div className="text-xs text-muted-foreground">Audio Enhanced</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-500">5</div>
              <div className="text-xs text-muted-foreground">Clips Created</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-yellow-500">2.4k</div>
              <div className="text-xs text-muted-foreground">Words Transcribed</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/20 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-pink-500">8</div>
              <div className="text-xs text-muted-foreground">Captions Synced</div>
            </div>
          </div>
        )}
        
        {/* Main Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Upload CTA - Enhanced visual design */}
          <Link 
            to="/upload"
            className="md:col-span-2 group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all duration-300"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/30 transition-colors duration-500" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 group-hover:bg-accent/30 transition-colors duration-500" />
            
            {/* Content */}
            <div className="relative z-10 p-6 flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300 shrink-0">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  Upload New Content
                </h2>
                <p className="text-muted-foreground">
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
            
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
              backgroundSize: '24px 24px'
            }} />
          </Link>
          
          {/* Recent Projects - Enhanced card */}
          <div className="bg-gradient-to-br from-card via-card to-card/50 border border-border hover:border-primary/20 rounded-2xl p-6 transition-all duration-300 shadow-lg shadow-background/50">
            <div className="flex items-center justify-between mb-5">
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
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <FolderOpen className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">No projects yet</p>
                <p className="text-muted-foreground/70 text-xs">Upload content to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.slice(0, 4).map((project, index) => (
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
        </div>
        
        {/* Usage & Revive Section */}
        <div className="grid md:grid-cols-2 gap-6">
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
