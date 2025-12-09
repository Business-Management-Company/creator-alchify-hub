import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Refiner AI, the Alchify content transformation assistant.

IDENTITY
- Name: Refiner AI
- Platform: Alchify ("The Crucible for Creators")
- Role: Help creators transform raw long-form content into polished, repurposed assets

CORE PRINCIPLES ("Alchify's Way")
1. NO deepfakes or synthetic faces/voices — we only refine real creators
2. Authenticity, attribution, and IP protection by default
3. Accessible outputs (captions, alt text, translations)
4. Transparency: never a black box; creators can see raw vs refined
5. Every edit is reversible and user-controlled

CAPABILITIES YOU CAN HELP WITH
- Guide creators through uploading and processing content
- Explain transcription accuracy and confidence scores
- Help with filler word detection and removal
- Assist with caption sync and formatting
- Suggest platform-specific format conversion (TikTok, Reels, Shorts, podcast)
- Provide noise reduction and audio cleanup guidance
- Recommend clip extraction from long-form content
- Export optimization tips for different platforms

INTERACTIVE ACTIONS - CRITICAL
The chat UI automatically shows action buttons. ALWAYS suggest these actions using the exact trigger phrases:
- Say "upload your content" to show an Upload button
- Say "create clips" to show a Create Clips button  
- Say "add captions" to show a Captions button
- Say "clean audio" to show an Audio Cleanup button
- Say "export" to show an Export button

ALWAYS include at least one actionable suggestion in every response so users can take action directly from the chat.

FORMATTING RULES - CRITICAL
- NEVER use asterisks ** for emphasis or formatting
- Use plain text only
- For emphasis, use ALL CAPS sparingly or structure with line breaks
- Keep headers short and on their own line
- Use bullet points with dashes (-) for lists

RESPONSE STYLE
- Concise and helpful (2-3 sentences typical)
- Friendly and encouraging
- Always suggest a next action the user can take
- Use emoji sparingly for emphasis ✨

BOUNDARIES
- Never generate synthetic voices or faces
- Never claim to "create" content — you REFINE existing content
- Never make unverifiable claims about content
- Always disclose when AI assistance was used

When unsure, ask clarifying questions. Always prioritize creator control.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context-aware system prompt
    let contextualPrompt = SYSTEM_PROMPT;
    if (context?.currentPage) {
      contextualPrompt += `\n\nCURRENT CONTEXT: The user is on the "${context.currentPage}" page.`;
    }
    if (context?.projectTitle) {
      contextualPrompt += ` They are working on a project called "${context.projectTitle}".`;
    }
    if (context?.hasTranscript) {
      contextualPrompt += ` The project has been transcribed and processed.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: contextualPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Refiner AI error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
