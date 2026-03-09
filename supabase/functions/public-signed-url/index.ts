import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { paths } = await req.json();

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return new Response(JSON.stringify({ error: "paths array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limit to 20 paths per request
    const limitedPaths = paths.slice(0, 20);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results: Record<string, string> = {};

    await Promise.all(
      limitedPaths.map(async (path: string) => {
        const { data, error } = await supabaseAdmin.storage
          .from("media-uploads")
          .createSignedUrl(path, 3600);

        if (!error && data?.signedUrl) {
          results[path] = data.signedUrl;
        }
      })
    );

    return new Response(JSON.stringify({ urls: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
