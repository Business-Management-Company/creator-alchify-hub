import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  FileText, 
  Scissors, 
  Zap, 
  Video, 
  Music,
  TrendingUp,
  Loader2,
  BarChart3
} from 'lucide-react';

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch user's analytics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['user-analytics', user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Get all projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id);

      // Get all transcripts
      const { data: transcripts } = await supabase
        .from('transcripts')
        .select('*');

      // Calculate stats
      const totalProjects = projects?.length || 0;
      const videoProjects = projects?.filter(p => p.source_file_type?.includes('video')).length || 0;
      const audioProjects = projects?.filter(p => p.source_file_type?.includes('audio')).length || 0;
      
      const totalWordCount = transcripts?.reduce((acc, t) => acc + (t.word_count || 0), 0) || 0;
      const totalFillerWords = transcripts?.reduce((acc, t) => acc + (t.filler_words_detected || 0), 0) || 0;
      const avgConfidence = transcripts?.length 
        ? transcripts.reduce((acc, t) => acc + (Number(t.avg_confidence) || 0), 0) / transcripts.length 
        : 0;

      // Estimate time saved (filler removal + transcription time)
      const minutesSaved = Math.round((totalFillerWords * 0.5) + (totalWordCount * 0.02));

      return {
        totalProjects,
        videoProjects,
        audioProjects,
        totalWordCount,
        totalFillerWords,
        avgConfidence: Math.round(avgConfidence * 100),
        minutesSaved,
        transcriptsCount: transcripts?.length || 0,
      };
    },
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Analytics | Alchify</title>
        <meta name="description" content="View your content creation analytics and insights" />
      </Helmet>

      <AppLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Track your content creation progress and AI-powered improvements
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.minutesSaved || 0} min</div>
                <p className="text-xs text-muted-foreground">
                  From AI transcription & cleanup
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FileText className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.videoProjects} videos, {stats?.audioProjects} audio
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Filler Words Removed</CardTitle>
                <Scissors className="h-4 w-4 text-orange-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalFillerWords || 0}</div>
                <p className="text-xs text-muted-foreground">
                  "um", "uh", "like" detected
                </p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Accuracy Score</CardTitle>
                <Zap className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.avgConfidence || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Average transcription confidence
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Content Breakdown
                </CardTitle>
                <CardDescription>Your content by type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Video className="h-4 w-4 text-blue-400" />
                    </div>
                    <span className="font-medium">Video Files</span>
                  </div>
                  <span className="text-2xl font-bold">{stats?.videoProjects || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Music className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="font-medium">Audio Files</span>
                  </div>
                  <span className="text-2xl font-bold">{stats?.audioProjects || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <FileText className="h-4 w-4 text-green-400" />
                    </div>
                    <span className="font-medium">Transcripts Created</span>
                  </div>
                  <span className="text-2xl font-bold">{stats?.transcriptsCount || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Processing Stats
                </CardTitle>
                <CardDescription>AI-powered improvements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">Words Transcribed</span>
                  <span className="text-xl font-bold text-primary">
                    {(stats?.totalWordCount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">Filler Words Detected</span>
                  <span className="text-xl font-bold text-orange-400">
                    {stats?.totalFillerWords || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">Avg. Confidence</span>
                  <span className="text-xl font-bold text-green-400">
                    {stats?.avgConfidence || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Analytics;
