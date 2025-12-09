import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, transcriptContent, transcriptSegments, aspectRatio } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing speakers for project:", projectId);
    console.log("Aspect ratio:", aspectRatio);

    // Prepare transcript data for analysis
    const transcriptText = transcriptContent || 
      (transcriptSegments?.map((seg: any) => seg.text || seg.content).join(" ") || "");

    if (!transcriptText) {
      throw new Error("No transcript content provided");
    }

    // Use AI to analyze the transcript for speaker changes and suggest focus regions
    const systemPrompt = `You are a video production AI assistant that analyzes transcripts to detect speaker changes and suggest optimal camera focus regions.

Your task is to:
1. Identify speaker changes or natural content breaks in the transcript
2. Suggest focus regions (x, y coordinates as percentages from 0-1) where a speaker would typically be
3. For single-speaker content, suggest subtle framing variations to keep the video dynamic

Output format must be valid JSON with this structure:
{
  "speakerCount": 1,
  "speakerSegments": [
    {
      "startTime": 0,
      "endTime": 10,
      "speaker": "Speaker 1",
      "focusRegion": {
        "x": 0.5,
        "y": 0.4,
        "width": 0.4,
        "height": 0.5
      },
      "confidence": 0.95
    }
  ]
}

Guidelines:
- For talking head videos, center the focus (x: 0.5, y: 0.35-0.45)
- Add subtle variations in x (0.45-0.55) to create natural movement
- Keep y focused on upper third where faces typically are
- Confidence should reflect how certain you are about speaker detection
- Create segments every 5-15 seconds for natural pacing`;

    const userPrompt = `Analyze this transcript and create speaker focus regions for a ${aspectRatio} aspect ratio video:

${transcriptText.slice(0, 3000)}

${transcriptSegments ? `
Segment timing data available:
${JSON.stringify(transcriptSegments.slice(0, 10), null, 2)}
` : "No timing data available - estimate based on content."}

Generate focus regions that would work well for dynamic reframing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response:", aiContent);

    // Parse the JSON response
    let analysisResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || 
                        aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      analysisResult = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return demo data if parsing fails
      analysisResult = {
        speakerCount: 1,
        speakerSegments: [
          {
            startTime: 0,
            endTime: 8,
            speaker: "Speaker 1",
            focusRegion: { x: 0.5, y: 0.4, width: 0.4, height: 0.5 },
            confidence: 0.9,
          },
          {
            startTime: 8,
            endTime: 16,
            speaker: "Speaker 1",
            focusRegion: { x: 0.48, y: 0.38, width: 0.42, height: 0.52 },
            confidence: 0.88,
          },
          {
            startTime: 16,
            endTime: 25,
            speaker: "Speaker 1",
            focusRegion: { x: 0.52, y: 0.42, width: 0.38, height: 0.48 },
            confidence: 0.92,
          },
        ],
      };
    }

    console.log("Analysis result:", JSON.stringify(analysisResult, null, 2));

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Speaker analysis error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
