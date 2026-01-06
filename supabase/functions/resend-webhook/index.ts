import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

// Resend webhook event types
type ResendEventType = 
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.complained"
  | "email.bounced"
  | "email.opened"
  | "email.clicked";

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    click?: { link: string };
    bounce?: { message: string };
  };
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

    const payload: ResendWebhookPayload = await req.json();
    console.log("Received Resend webhook:", payload.type, payload.data.email_id);

    const resendId = payload.data.email_id;
    const eventType = payload.type.replace("email.", "");

    // Find the email send record by resend_id
    const { data: emailSend, error: findError } = await supabaseClient
      .from("email_sends")
      .select("id, status")
      .eq("resend_id", resendId)
      .single();

    if (findError || !emailSend) {
      console.log("Email send record not found for resend_id:", resendId);
      // Still return 200 to acknowledge webhook
      return new Response(
        JSON.stringify({ received: true, matched: false }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the event
    await supabaseClient.from("email_events").insert({
      email_send_id: emailSend.id,
      event_type: eventType,
      event_data: payload.data,
      occurred_at: payload.created_at,
    });

    // Update email send status and timestamps
    const updateData: Record<string, any> = { status: eventType };
    
    switch (eventType) {
      case "delivered":
        updateData.delivered_at = payload.created_at;
        break;
      case "opened":
        updateData.opened_at = payload.created_at;
        break;
      case "clicked":
        updateData.clicked_at = payload.created_at;
        break;
      case "bounced":
        updateData.bounced_at = payload.created_at;
        break;
    }

    await supabaseClient
      .from("email_sends")
      .update(updateData)
      .eq("id", emailSend.id);

    console.log("Updated email send:", emailSend.id, "with event:", eventType);

    return new Response(
      JSON.stringify({ received: true, matched: true, event: eventType }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
