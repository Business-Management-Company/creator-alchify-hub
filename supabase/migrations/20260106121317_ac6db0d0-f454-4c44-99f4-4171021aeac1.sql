-- Email Templates table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  category TEXT NOT NULL DEFAULT 'transactional', -- transactional, marketing
  description TEXT,
  variables JSONB DEFAULT '[]', -- ["name", "email", "link"]
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Email Sends table (for tracking sent emails)
CREATE TABLE public.email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  resend_id TEXT, -- ID from Resend API
  from_email TEXT NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent', -- sent, delivered, opened, clicked, bounced, complained
  variables JSONB, -- Variables used in this send
  metadata JSONB, -- Additional metadata
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Email Events table (for detailed analytics)
CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_send_id UUID REFERENCES public.email_sends(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced, complained
  event_data JSONB,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_templates (admin only)
CREATE POLICY "Admins can manage email templates"
ON public.email_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for email_sends (admin only)
CREATE POLICY "Admins can view email sends"
ON public.email_sends
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for email_events (admin only)
CREATE POLICY "Admins can view email events"
ON public.email_events
FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_email_templates_category ON public.email_templates(category);
CREATE INDEX idx_email_sends_template_id ON public.email_sends(template_id);
CREATE INDEX idx_email_sends_status ON public.email_sends(status);
CREATE INDEX idx_email_sends_sent_at ON public.email_sends(sent_at);
CREATE INDEX idx_email_events_send_id ON public.email_events(email_send_id);
CREATE INDEX idx_email_events_type ON public.email_events(event_type);