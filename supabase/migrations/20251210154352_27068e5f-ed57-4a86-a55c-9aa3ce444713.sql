-- Create admin_sessions table for presence tracking
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  display_name TEXT,
  email TEXT,
  current_section TEXT NOT NULL DEFAULT 'Admin Dashboard',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT admin_sessions_user_unique UNIQUE (admin_user_id)
);

-- Create indexes for performance
CREATE INDEX idx_admin_sessions_user_id ON public.admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_last_seen ON public.admin_sessions(last_seen_at);

-- Enable RLS
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin sessions
CREATE POLICY "Admins can view all admin sessions"
ON public.admin_sessions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Admins can insert/update their own session
CREATE POLICY "Admins can manage their own session"
ON public.admin_sessions
FOR ALL
USING (
  admin_user_id = auth.uid() 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
)
WITH CHECK (
  admin_user_id = auth.uid() 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
);