import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmailSend {
  id: string;
  template_id: string | null;
  resend_id: string | null;
  from_email: string;
  to_email: string;
  subject: string;
  status: string;
  variables: Record<string, string> | null;
  metadata: Record<string, any> | null;
  sent_at: string;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  bounced_at: string | null;
  created_by: string | null;
  created_at: string;
  template?: {
    name: string;
    category: string;
  };
}

export interface EmailEvent {
  id: string;
  email_send_id: string;
  event_type: string;
  event_data: Record<string, any> | null;
  occurred_at: string;
}

export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  complained: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export function useEmailSends(options?: {
  templateId?: string;
  status?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["email-sends", options],
    queryFn: async () => {
      let query = supabase
        .from("email_sends")
        .select(`
          *,
          template:email_templates(name, category)
        `)
        .order("sent_at", { ascending: false });

      if (options?.templateId) {
        query = query.eq("template_id", options.templateId);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as EmailSend[];
    },
  });
}

export function useEmailEvents(emailSendId: string | undefined) {
  return useQuery({
    queryKey: ["email-events", emailSendId],
    queryFn: async () => {
      if (!emailSendId) return [];
      const { data, error } = await supabase
        .from("email_events")
        .select("*")
        .eq("email_send_id", emailSendId)
        .order("occurred_at", { ascending: true });

      if (error) throw error;
      return data as EmailEvent[];
    },
    enabled: !!emailSendId,
  });
}

export function useEmailStats(options?: {
  templateId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  return useQuery({
    queryKey: ["email-stats", options],
    queryFn: async () => {
      let query = supabase.from("email_sends").select("status");

      if (options?.templateId) {
        query = query.eq("template_id", options.templateId);
      }
      if (options?.dateFrom) {
        query = query.gte("sent_at", options.dateFrom);
      }
      if (options?.dateTo) {
        query = query.lte("sent_at", options.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      const total = data.length;
      const sent = data.filter((e) => e.status === "sent").length;
      const delivered = data.filter((e) => e.status === "delivered").length;
      const opened = data.filter((e) => e.status === "opened").length;
      const clicked = data.filter((e) => e.status === "clicked").length;
      const bounced = data.filter((e) => e.status === "bounced").length;
      const complained = data.filter((e) => e.status === "complained").length;

      const deliveredOrBetter = delivered + opened + clicked;
      const openRate = deliveredOrBetter > 0 ? ((opened + clicked) / deliveredOrBetter) * 100 : 0;
      const clickRate = (opened + clicked) > 0 ? (clicked / (opened + clicked)) * 100 : 0;
      const bounceRate = total > 0 ? (bounced / total) * 100 : 0;

      return {
        total,
        sent,
        delivered: deliveredOrBetter,
        opened: opened + clicked,
        clicked,
        bounced,
        complained,
        openRate: Math.round(openRate * 10) / 10,
        clickRate: Math.round(clickRate * 10) / 10,
        bounceRate: Math.round(bounceRate * 10) / 10,
      } as EmailStats;
    },
  });
}
