import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

export interface EmailSend {
  id: string;
  template_id: string | null;
  resend_id: string | null;
  from_email: string;
  to_email: string;
  subject: string;
  status: string;
  variables: Record<string, string> | null;
  metadata: Record<string, unknown> | null;
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
  event_data: Record<string, unknown> | null;
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
      const params: Record<string, string> = {};
      if (options?.templateId) params.templateId = options.templateId;
      if (options?.status) params.status = options.status;
      if (options?.limit) params.limit = String(options.limit);
      
      const { data, error } = await apiGet<EmailSend[]>("/email-sends", params);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useEmailEvents(emailSendId: string | undefined) {
  return useQuery({
    queryKey: ["email-events", emailSendId],
    queryFn: async () => {
      if (!emailSendId) return [];
      const { data, error } = await apiGet<EmailEvent[]>(`/email-sends/${emailSendId}/events`);
      if (error) throw error;
      return data || [];
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
      const params: Record<string, string> = {};
      if (options?.templateId) params.templateId = options.templateId;
      if (options?.dateFrom) params.dateFrom = options.dateFrom;
      if (options?.dateTo) params.dateTo = options.dateTo;
      
      const { data, error } = await apiGet<EmailStats>("/email-stats", params);
      if (error) throw error;
      return data || {
        total: 0,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        bounced: 0,
        complained: 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
      };
    },
  });
}
