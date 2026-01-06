import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  BarChart3,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Users,
  FolderOpen,
  Wand2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

interface AnalyticsData {
  total_users: number;
  total_projects: number;
  total_transcripts: number;
  users_today: number;
  projects_today: number;
  projects_by_status: Record<string, number>;
}

const AdminAnalytics = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await apiGet<AnalyticsData>('/admin/stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const transcriptRate = stats?.total_projects && stats?.total_transcripts 
    ? Math.round((stats.total_transcripts / stats.total_projects) * 100) 
    : 0;

  return (
    <>
      <Helmet>
        <title>Analytics | Admin | Alchify</title>
      </Helmet>
      
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Analytics
              </h1>
              <p className="text-muted-foreground mt-1">
                Platform usage and performance metrics
              </p>
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_users || 0}</div>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats?.users_today || 0} today
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Projects
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_projects || 0}</div>
                <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats?.projects_today || 0} today
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Transcripts
                </CardTitle>
                <Wand2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.total_transcripts || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Generated transcripts
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Activation Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{transcriptRate}%</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Projects with transcripts
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Projects by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Project Pipeline</CardTitle>
              <CardDescription>Distribution of projects by status</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.projects_by_status && Object.keys(stats.projects_by_status).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(stats.projects_by_status).map(([status, count]) => {
                    const percentage = stats.total_projects 
                      ? Math.round((count / stats.total_projects) * 100) 
                      : 0;
                    return (
                      <div key={status} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize font-medium">{status}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No project data available
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Placeholder for future charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New user signups over time</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>AI Usage</CardTitle>
                <CardDescription>Transcriptions and processing over time</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default AdminAnalytics;
