import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Users,
  FolderOpen,
  FileText,
  TrendingUp,
  Shield,
  Settings,
  BarChart3,
  Loader2,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';

interface DashboardStats {
  total_users: number;
  total_projects: number;
  total_transcripts: number;
  users_today: number;
  projects_today: number;
  projects_by_status: Record<string, number>;
}

interface TaskStats {
  total: number;
  open: number;
  dueThisWeek: number;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();
  const { toast } = useToast();
  const hasShownAccessDenied = useRef(false);
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, open: 0, dueThisWeek: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Only show access denied once and only when explicitly denied (not during navigation)
    if (!adminLoading && !isAdmin && user && !hasShownAccessDenied.current) {
      hasShownAccessDenied.current = true;
      toast({
        title: 'Access Denied',
        description: 'You do not have admin privileges.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [isAdmin, adminLoading, user, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchTaskStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_stats');
      if (error) throw error;
      setStats(data as unknown as DashboardStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard stats',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      // Get total tasks
      const { count: totalCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });
      
      // Get open tasks (not completed)
      const { data: statuses } = await supabase
        .from('task_statuses')
        .select('id, slug')
        .neq('slug', 'completed');
      
      const openStatusIds = statuses?.map(s => s.id) || [];
      
      const { count: openCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .in('status_id', openStatusIds);
      
      // Get tasks due this week
      const now = new Date();
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + 7);
      
      const { count: dueCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .gte('due_date', now.toISOString().split('T')[0])
        .lte('due_date', endOfWeek.toISOString().split('T')[0]);
      
      setTaskStats({
        total: totalCount || 0,
        open: openCount || 0,
        dueThisWeek: dueCount || 0,
      });
    } catch (error) {
      console.error('Error fetching task stats:', error);
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

  return (
    <>
      <Helmet>
        <title>Admin Dashboard | Alchify</title>
      </Helmet>
      
      <AppLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                System overview and management
              </p>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_users || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.users_today || 0} today
                </p>
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
                <div className="text-2xl font-bold">{stats?.total_projects || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats?.projects_today || 0} today
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Transcripts
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total_transcripts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  AI-generated transcripts
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.total_projects && stats?.total_transcripts 
                    ? Math.round((stats.total_transcripts / stats.total_projects) * 100) 
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Projects with transcripts
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Task Card - Highlighted */}
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                Task Overview
              </CardTitle>
              <CardDescription>
                Manage team tasks and track progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
                  <div className="text-2xl font-bold text-foreground">{taskStats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Tasks</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-2xl font-bold text-amber-600">{taskStats.open}</div>
                  <div className="text-xs text-amber-600/80">Open</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-600">{taskStats.dueThisWeek}</div>
                  <div className="text-xs text-blue-600/80 flex items-center justify-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due This Week
                  </div>
                </div>
              </div>
              <Button 
                variant="default" 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={() => navigate('/admin/tasks')}
              >
                Go to Task Manager
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/users')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  User Management
                </CardTitle>
                <CardDescription>
                  View and manage user accounts and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Manage Users
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/content')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  Content Overview
                </CardTitle>
                <CardDescription>
                  Browse and moderate all projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  View Content
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
            
            <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate('/admin/analytics')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Analytics
                </CardTitle>
                <CardDescription>
                  Platform usage and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  View Analytics
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Projects by Status */}
          {stats?.projects_by_status && Object.keys(stats.projects_by_status).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Projects by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(stats.projects_by_status).map(([status, count]) => (
                    <div key={status} className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm text-muted-foreground capitalize">{status}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </AppLayout>
    </>
  );
};

export default AdminDashboard;
