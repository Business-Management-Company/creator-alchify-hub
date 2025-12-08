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
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Upload CTA */}
          <Link 
            to="/upload"
            className="md:col-span-2 bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 rounded-2xl p-8 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-colors"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="p-3 rounded-xl bg-primary/20 w-fit mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Upload New Content
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Drop your raw video or audio files here. We'll transcribe, clean up, and help you create polished clips for any platform.
              </p>
              <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 group-hover:glow-primary transition-shadow pointer-events-none">
                <Plus className="mr-2 h-4 w-4" />
                Upload Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </div>
          </Link>
          
          {/* Recent Projects */}
          <div className="bg-card/50 border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Recent Projects</h3>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link to="/projects">View All</Link>
              </Button>
            </div>
            
            {loadingProjects ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">No projects yet</p>
                <p className="text-muted-foreground/70 text-xs">Upload content to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.slice(0, 4).map((project) => (
                  <Link
                    key={project.id}
                    to={`/refiner/${project.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="p-1.5 rounded-md bg-primary/10">
                      {project.source_file_type === 'video' ? (
                        <Video className="h-4 w-4 text-primary" />
                      ) : (
                        <Music className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{project.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(project.created_at)}</p>
                    </div>
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
