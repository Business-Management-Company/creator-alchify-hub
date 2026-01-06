import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';

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
        const { data, error } = await apiGet<{ isAdmin: boolean }>('/auth/check-admin');
        
        if (error) throw error;
        
        setIsAdmin(data?.isAdmin === true);
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
