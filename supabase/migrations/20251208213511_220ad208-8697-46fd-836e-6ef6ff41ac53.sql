-- Create pricing plans table
CREATE TABLE public.pricing_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  storage_gb TEXT NOT NULL,
  recording_hours TEXT NOT NULL,
  livestream_hours TEXT NOT NULL,
  podcasts TEXT NOT NULL,
  team_members INTEGER,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create pricing features table (one-to-many)
CREATE TABLE public.pricing_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id TEXT REFERENCES public.pricing_plans(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT REFERENCES public.pricing_plans(id) NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Create usage tracking table
CREATE TABLE public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  storage_used_gb DECIMAL(10,2) DEFAULT 0,
  recording_hours_used DECIMAL(10,2) DEFAULT 0,
  livestream_hours_used DECIMAL(10,2) DEFAULT 0,
  podcasts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Public read for pricing plans and features
CREATE POLICY "Anyone can view pricing plans" ON public.pricing_plans FOR SELECT USING (true);
CREATE POLICY "Anyone can view pricing features" ON public.pricing_features FOR SELECT USING (true);

-- Admins can manage pricing
CREATE POLICY "Admins can manage pricing plans" ON public.pricing_plans FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage pricing features" ON public.pricing_features FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Users can view/manage their own subscription
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON public.user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscription" ON public.user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Users can view/manage their own usage
CREATE POLICY "Users can view own usage" ON public.user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON public.user_usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON public.user_usage FOR UPDATE USING (auth.uid() = user_id);

-- Seed pricing plans data
INSERT INTO public.pricing_plans (id, name, price, storage_gb, recording_hours, livestream_hours, podcasts, team_members, is_popular, display_order) VALUES
('free', 'Free', 0, '25', '10', '5', '1', NULL, false, 0),
('starter', 'Starter', 19, '50', '15', '10', '1', NULL, false, 1),
('creator', 'Creator', 39, '150', '30', '15', '3', NULL, false, 2),
('pro', 'Pro', 79, '500', 'unlimited', '25', '5', NULL, true, 3),
('power_user', 'Power User', 149, '1000', 'unlimited', 'unlimited', '10', NULL, false, 4),
('studio', 'Studio Team', 279, '3000', 'unlimited', 'unlimited', 'unlimited', 10, false, 5),
('enterprise', 'Enterprise', 2000, 'custom', 'unlimited', 'unlimited', 'unlimited', NULL, false, 6);

-- Seed pricing features
INSERT INTO public.pricing_features (plan_id, feature, display_order) VALUES
-- Free
('free', 'Basic Studio Access', 0),
('free', 'Watermarked Clips', 1),
('free', 'Auto Captions + Transcripts', 2),
('free', 'Standard Exports', 3),
('free', 'Email Support', 4),
-- Starter
('starter', 'Basic AI Editing', 0),
('starter', 'Filler Removal', 1),
('starter', 'Basic Analytics', 2),
('starter', 'Email + Chat Support', 3),
-- Creator
('creator', 'AI Clip Generation', 0),
('creator', 'Auto Vertical/Horizontal Format', 1),
('creator', 'Multi-Guest Collaboration', 2),
('creator', 'Podcast Page + RSS Hosting', 3),
('creator', 'Engagement Analytics', 4),
-- Pro
('pro', 'Full AI Editing Suite', 0),
('pro', 'Batch Clip Export', 1),
('pro', 'Branding Toolkit', 2),
('pro', 'Priority Support', 3),
-- Power User
('power_user', 'Multi-Camera Recording', 0),
('power_user', 'Guest Green Rooms', 1),
('power_user', 'Audience Interaction', 2),
('power_user', 'Advanced Analytics', 3),
('power_user', 'Custom RTMP Streaming', 4),
('power_user', '24h Support Response', 5),
-- Studio Team
('studio', 'Team Workspace', 0),
('studio', 'Shared Asset Library', 1),
('studio', 'Roles & Permissions', 2),
('studio', 'AI Storyboarding', 3),
('studio', 'Dedicated Onboarding', 4),
-- Enterprise
('enterprise', 'White-Label Studio', 0),
('enterprise', 'Custom Domain + Branding', 1),
('enterprise', 'SSO', 2),
('enterprise', 'API Access', 3),
('enterprise', 'Custom AI Workflows', 4),
('enterprise', 'Compliance Package', 5),
('enterprise', 'Dedicated Account Manager', 6),
('enterprise', 'SLA Support', 7);

-- Trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON public.user_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();