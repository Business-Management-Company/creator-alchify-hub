import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { toast } from "sonner";

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  category: string;
  description: string | null;
  variables: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  category: string;
  description?: string;
  variables?: string[];
  is_active?: boolean;
}

export interface UpdateEmailTemplateInput extends Partial<CreateEmailTemplateInput> {
  id: string;
}

export function useEmailTemplates(category?: string) {
  return useQuery({
    queryKey: ["email-templates", category],
    queryFn: async () => {
      const params = category ? { category } : undefined;
      const { data, error } = await apiGet<EmailTemplate[]>("/email-templates", params);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useEmailTemplate(id: string | undefined) {
  return useQuery({
    queryKey: ["email-template", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await apiGet<EmailTemplate>(`/email-templates/${id}`);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEmailTemplateInput) => {
      const { data, error } = await apiPost<EmailTemplate>("/email-templates", {
        ...input,
        variables: input.variables || [],
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Email template created");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateEmailTemplateInput) => {
      const { data, error } = await apiPatch<EmailTemplate>(`/email-templates/${id}`, input);

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["email-template", data.id] });
      }
      toast.success("Email template updated");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await apiDelete(`/email-templates/${id}`);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast.success("Email template deleted");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

export function useSendEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      templateId?: string;
      to: string | string[];
      subject?: string;
      html?: string;
      text?: string;
      from?: string;
      variables?: Record<string, string>;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await apiPost("/send-email", input);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-sends"] });
      toast.success("Email sent successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to send email: ${error.message}`);
    },
  });
}
