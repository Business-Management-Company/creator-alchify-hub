import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
    navigate('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sparkles className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = [
    { label: 'Time Saved', value: '0 hrs', icon: Clock },
    { label: 'Projects', value: '0', icon: FolderOpen },
    { label: 'Exports', value: '0', icon: Wand2 },
    { label: 'Avg Accuracy', value: '—', icon: BarChart3 },
  ];

  return (
    <>
      <Helmet>
        <title>Dashboard | Alchify</title>
        <meta name="description" content="Your Alchify dashboard - manage projects, upload content, and refine your media." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold gradient-text">Alchify</span>
            </a>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
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
                className="bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
          
          {/* Main Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Upload CTA */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 rounded-2xl p-8 relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-colors">
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
                <Button variant="hero" className="group-hover:glow-primary transition-shadow">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Recent Projects */}
            <div className="bg-card/50 border border-border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Recent Projects</h3>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All
                </Button>
              </div>
              
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">No projects yet</p>
                <p className="text-muted-foreground/70 text-xs">Upload content to get started</p>
              </div>
            </div>
          </div>
          
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
        </main>
      </div>
    </>
  );
};

export default Dashboard;
