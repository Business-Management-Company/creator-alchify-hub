import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminCheck } from '@/hooks/useAdminCheck';

export interface AdminPresence {
  id: string;
  admin_user_id: string;
  display_name: string | null;
  email: string | null;
  current_section: string;
  last_seen_at: string;
  is_self: boolean;
  is_idle: boolean;
}

// Map routes to section names
const SECTION_MAP: Record<string, string> = {
  '/admin': 'Admin Dashboard',
  '/admin/tasks': 'Tasks',
  '/admin/users': 'Manage Users',
  '/admin/contacts': 'Contacts',
  '/admin/content': 'Content',
  '/admin/analytics': 'Analytics',
  '/admin/tech-stack': 'Tech Stack',
  '/admin/ceo-vto': 'CEO VTO',
  '/admin/cfo-dashboard': 'CFO Dashboard',
  '/admin/tasks/settings': 'Task Settings',
  '/admin/insight-sources': 'Insight Sources',
};

function getSectionFromPath(pathname: string): string | null {
  // Check exact match first
  if (SECTION_MAP[pathname]) {
    return SECTION_MAP[pathname];
  }
  
  // Check for dynamic routes (e.g., /admin/tasks/123)
  if (pathname.startsWith('/admin/tasks/')) {
    return 'Tasks';
  }
  
  // Check if we're in admin area at all
  if (pathname.startsWith('/admin')) {
    return 'Admin Dashboard';
  }
  
  return null;
}

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const POLL_INTERVAL = 20000; // 20 seconds
const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes for idle status
const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes to be considered active

export function useAdminPresence() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const location = useLocation();
  const [activeAdmins, setActiveAdmins] = useState<AdminPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const currentSection = getSectionFromPath(location.pathname);
  const isInAdminArea = currentSection !== null;

  // Send heartbeat to update presence
  const sendHeartbeat = useCallback(async (section: string) => {
    if (!user || !isAdmin) return;

    try {
      // Fetch display name from profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const displayName = profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Admin';

      // Upsert presence record
      const { error: upsertError } = await supabase
        .from('admin_sessions')
        .upsert({
          admin_user_id: user.id,
          display_name: displayName,
          email: user.email,
          current_section: section,
          last_seen_at: new Date().toISOString(),
        }, {
          onConflict: 'admin_user_id',
        });

      if (upsertError) {
        console.error('Failed to send heartbeat:', upsertError);
      }
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  }, [user, isAdmin]);

  // Fetch active admins
  const fetchActiveAdmins = useCallback(async () => {
    if (!user || !isAdmin) return;

    try {
      const cutoff = new Date(Date.now() - ACTIVE_THRESHOLD_MS).toISOString();
      
      const { data, error: fetchError } = await supabase
        .from('admin_sessions')
        .select('*')
        .gte('last_seen_at', cutoff)
        .order('last_seen_at', { ascending: false });

      if (fetchError) {
        setError('Failed to fetch active admins');
        console.error('Fetch error:', fetchError);
        return;
      }

      const now = Date.now();
      const admins: AdminPresence[] = (data || []).map((session: any) => {
        const lastSeen = new Date(session.last_seen_at).getTime();
        const isIdle = now - lastSeen > IDLE_THRESHOLD_MS;
        
        return {
          id: session.id,
          admin_user_id: session.admin_user_id,
          display_name: session.display_name,
          email: session.email,
          current_section: session.current_section,
          last_seen_at: session.last_seen_at,
          is_self: session.admin_user_id === user.id,
          is_idle: isIdle,
        };
      });

      setActiveAdmins(admins);
      setError(null);
    } catch (err) {
      console.error('Error fetching admins:', err);
      setError('Failed to fetch active admins');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  // Clear presence when leaving admin area
  const clearPresence = useCallback(async () => {
    if (!user) return;

    try {
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('admin_user_id', user.id);
    } catch (err) {
      console.error('Failed to clear presence:', err);
    }
  }, [user]);

  // Start/stop heartbeat based on admin area
  useEffect(() => {
    if (adminLoading) return;

    if (isInAdminArea && isAdmin && currentSection) {
      // Send initial heartbeat
      sendHeartbeat(currentSection);
      
      // Start heartbeat interval
      heartbeatRef.current = setInterval(() => {
        sendHeartbeat(currentSection);
      }, HEARTBEAT_INTERVAL);

      // Start polling for active admins
      fetchActiveAdmins();
      pollRef.current = setInterval(fetchActiveAdmins, POLL_INTERVAL);
    } else {
      // Clear intervals
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setActiveAdmins([]);
      setLoading(false);
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [isInAdminArea, isAdmin, currentSection, adminLoading, sendHeartbeat, fetchActiveAdmins]);

  // Clear presence on unmount or when leaving admin area
  useEffect(() => {
    return () => {
      if (!isInAdminArea) {
        clearPresence();
      }
    };
  }, [isInAdminArea, clearPresence]);

  const activeCount = activeAdmins.filter(a => !a.is_idle).length;
  const selfAdmin = activeAdmins.find(a => a.is_self);

  return {
    activeAdmins,
    activeCount,
    selfAdmin,
    loading,
    error,
    isInAdminArea,
    refresh: fetchActiveAdmins,
  };
}
