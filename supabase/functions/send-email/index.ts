import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  templateId?: string;
  to: string | string[];
  subject?: string;
  html?: string;
  text?: string;
  from?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, any>;
}

function replaceVariables(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get auth user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body: SendEmailRequest = await req.json();
    const { templateId, to, subject, html, text, from, variables = {}, metadata = {} } = body;

    let emailSubject = subject || "";
    let emailHtml = html || "";
    let emailText = text || "";
    const fromEmail = from || "Alchify <onboarding@resend.dev>";

    // If templateId is provided, fetch the template
    if (templateId) {
      const { data: template, error: templateError } = await supabaseClient
        .from("email_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError || !template) {
        throw new Error("Template not found");
      }

      if (!template.is_active) {
        throw new Error("Template is not active");
      }

      emailSubject = replaceVariables(template.subject, variables);
      emailHtml = replaceVariables(template.html_content, variables);
      emailText = template.text_content ? replaceVariables(template.text_content, variables) : "";
    }

    if (!emailSubject || !emailHtml) {
      throw new Error("Subject and HTML content are required");
    }

    // Normalize to array
    const recipients = Array.isArray(to) ? to : [to];

    // Send emails
    const results = [];
    for (const recipient of recipients) {
      const emailResponse = await resend.emails.send({
        from: fromEmail,
        to: [recipient],
        subject: emailSubject,
        html: emailHtml,
        text: emailText || undefined,
      });

      console.log("Email sent:", emailResponse);

      // Log the send to database
      const { data: sendRecord, error: sendError } = await supabaseClient
        .from("email_sends")
        .insert({
          template_id: templateId || null,
          resend_id: emailResponse.data?.id || null,
          from_email: fromEmail,
          to_email: recipient,
          subject: emailSubject,
          status: "sent",
          variables,
          metadata,
          created_by: user.id,
        })
        .select()
        .single();

      if (sendError) {
        console.error("Error logging email send:", sendError);
      }

      // Log the sent event
      if (sendRecord) {
        await supabaseClient.from("email_events").insert({
          email_send_id: sendRecord.id,
          event_type: "sent",
          event_data: { resend_id: emailResponse.data?.id },
        });
      }

      results.push({
        to: recipient,
        resend_id: emailResponse.data?.id,
        success: true,
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
