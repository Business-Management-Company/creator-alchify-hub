import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, transcriptContent } = await req.json();
    
    if (!projectId || !transcriptContent) {
      throw new Error('Project ID and transcript content are required');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating clips for project: ${projectId}`);

    // Use AI to analyze transcript and suggest clips
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an AI clip generator for Alchify. Analyze the transcript and identify 3-5 compelling clip moments that would work well for social media.

For each clip, provide:
1. A catchy title (max 50 chars)
2. The start timestamp (from the transcript)
3. The end timestamp (estimate based on content, clips should be 15-60 seconds)
4. A brief hook/description (max 100 chars)
5. Suggested platforms (tiktok, reels, shorts, linkedin)
6. An engagement score (1-10) based on how viral/engaging the content is

Focus on:
- Emotional moments
- Key insights or tips
- Surprising statements
- Quotable phrases
- Story hooks

Return ONLY valid JSON in this exact format:
{
  "clips": [
    {
      "title": "Clip title",
      "startTime": "00:15",
      "endTime": "00:45",
      "hook": "Brief description of the clip",
      "platforms": ["tiktok", "reels"],
      "score": 8
    }
  ]
}`
          },
          {
            role: "user",
            content: `Analyze this transcript and suggest the best clips:\n\n${transcriptContent}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (response.status === 402) {
        throw new Error("AI credits exhausted. Please add credits to continue.");
      }
      throw new Error(`AI clip generation failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const rawContent = aiResponse.choices?.[0]?.message?.content || '';

    console.log('Raw AI response:', rawContent);

    // Parse the JSON from the response
    let clips = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        clips = parsed.clips || [];
      }
    } catch (parseError) {
      console.error('Error parsing clips JSON:', parseError);
      // Return empty clips if parsing fails
      clips = [];
    }

    console.log('Generated clips:', clips);

    return new Response(
      JSON.stringify({
        success: true,
        clips
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Clip generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});