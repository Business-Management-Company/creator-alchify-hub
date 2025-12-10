import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useAdminCheck = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkedRef = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      // If no user, set not admin and done loading
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        checkedRef.current = false;
        lastUserId.current = null;
        return;
      }

      // Skip if we already checked for this user
      if (checkedRef.current && lastUserId.current === user.id) {
        return;
      }

      try {
        setLoading(true);
        // Check for both admin and super_admin roles
        const [adminResult, superAdminResult] = await Promise.all([
          supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }),
          supabase.rpc('has_role', { _user_id: user.id, _role: 'super_admin' })
        ]);
        
        if (adminResult.error) throw adminResult.error;
        if (superAdminResult.error) throw superAdminResult.error;
        
        setIsAdmin(adminResult.data === true || superAdminResult.data === true);
        checkedRef.current = true;
        lastUserId.current = user.id;
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Only check when auth is done loading
    if (!authLoading) {
      checkAdmin();
    }
  }, [user, authLoading]);

  return { isAdmin, loading };
};
