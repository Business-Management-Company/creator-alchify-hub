import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  storage_gb: string;
  recording_hours: string;
  livestream_hours: string;
  podcasts: string;
  team_members: number | null;
  is_popular: boolean;
  features: string[];
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string | null;
}

export interface UserUsage {
  storage_used_gb: number;
  recording_hours_used: number;
  livestream_hours_used: number;
  podcasts_count: number;
}

export interface PlanLimits {
  storage_gb: number | 'unlimited' | 'custom';
  recording_hours: number | 'unlimited';
  livestream_hours: number | 'unlimited';
  podcasts: number | 'unlimited';
  team_members: number | null;
}

export function usePricingPlans() {
  return useQuery({
    queryKey: ['pricing-plans'],
    queryFn: async (): Promise<PricingPlan[]> => {
      const { data: plans, error: plansError } = await supabase
        .from('pricing_plans')
        .select('*')
        .order('display_order');

      if (plansError) throw plansError;

      const { data: features, error: featuresError } = await supabase
        .from('pricing_features')
        .select('*')
        .order('display_order');

      if (featuresError) throw featuresError;

      return (plans || []).map(plan => ({
        ...plan,
        features: (features || [])
          .filter(f => f.plan_id === plan.id)
          .map(f => f.feature)
      }));
    }
  });
}

export function useUserPlan() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user
  });
}

export function useUserUsage() {
  const { user } = useAuth();
  const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

  return useQuery({
    queryKey: ['user-usage', user?.id, monthYear],
    queryFn: async (): Promise<UserUsage> => {
      if (!user) {
        return {
          storage_used_gb: 0,
          recording_hours_used: 0,
          livestream_hours_used: 0,
          podcasts_count: 0
        };
      }

      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (error) throw error;

      return {
        storage_used_gb: Number(data?.storage_used_gb || 0),
        recording_hours_used: Number(data?.recording_hours_used || 0),
        livestream_hours_used: Number(data?.livestream_hours_used || 0),
        podcasts_count: data?.podcasts_count || 0
      };
    },
    enabled: !!user
  });
}

export function usePlanLimits() {
  const { data: subscription } = useUserPlan();
  const { data: plans } = usePricingPlans();

  const planId = subscription?.plan_id || 'free';
  const currentPlan = plans?.find(p => p.id === planId);

  if (!currentPlan) {
    return {
      plan: null,
      limits: {
        storage_gb: 25,
        recording_hours: 10,
        livestream_hours: 5,
        podcasts: 1,
        team_members: null
      } as PlanLimits
    };
  }

  const parseLimit = (value: string): number | 'unlimited' | 'custom' => {
    if (value === 'unlimited') return 'unlimited';
    if (value === 'custom') return 'custom';
    return parseInt(value, 10);
  };

  return {
    plan: currentPlan,
    limits: {
      storage_gb: parseLimit(currentPlan.storage_gb),
      recording_hours: parseLimit(currentPlan.recording_hours),
      livestream_hours: parseLimit(currentPlan.livestream_hours),
      podcasts: parseLimit(currentPlan.podcasts),
      team_members: currentPlan.team_members
    } as PlanLimits
  };
}

export function useFeatureAccess() {
  const { plan } = usePlanLimits();
  const planId = plan?.id || 'free';

  const planTier: Record<string, number> = {
    free: 0,
    starter: 1,
    creator: 2,
    pro: 3,
    power_user: 4,
    studio: 5,
    enterprise: 6
  };

  const currentTier = planTier[planId] || 0;

  return {
    planId,
    currentTier,
    hasFeature: (requiredPlan: string) => currentTier >= (planTier[requiredPlan] || 0),
    canRemoveWatermark: currentTier >= 2, // creator+
    canBatchExport: currentTier >= 3, // pro+
    canMultiCamera: currentTier >= 4, // power_user+
    canTeamWorkspace: currentTier >= 5, // studio+
    canWhiteLabel: currentTier >= 6, // enterprise
    canCustomRTMP: currentTier >= 4 // power_user+
  };
}
