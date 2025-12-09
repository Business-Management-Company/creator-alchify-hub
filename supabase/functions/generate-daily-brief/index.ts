import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type BriefAudience = 'ceo' | 'board' | 'investor' | 'creator';

const AUDIENCE_PROMPTS: Record<BriefAudience, string> = {
  ceo: `You are a strategic intelligence analyst for Alchify, a creator content platform. Generate an executive daily brief for the CEO focusing on:
- Strategic positioning vs competitors (Opus Clips, Descript, Riverside, Restream)
- Market shifts and trends in creator economy
- Platform changes (YouTube, TikTok, Spotify) that impact our strategy
- Key competitor moves that require attention
- 2-3 actionable strategic recommendations

Be concise but comprehensive. Focus on what matters for strategic decision-making.`,

  board: `You are a strategic intelligence analyst for Alchify. Generate a board-level daily brief focusing on:
- Competitive landscape overview and positioning
- Market opportunity signals
- Risk factors and competitive threats
- Key metrics context (how competitors are performing)
- High-level strategic implications

Be executive-focused - boards need the big picture, not operational details.`,

  investor: `You are a market intelligence analyst. Generate an investor-focused daily brief on Alchify's competitive position:
- Market traction signals vs competitors
- Competitive moat analysis
- Creator economy market trends
- Growth indicators in the space
- Investment-relevant developments

Focus on market validation and competitive differentiation.`,

  creator: `You are a helpful assistant for content creators. Generate a creator-focused daily brief on:
- New features from tools like Opus Clips, Descript, Riverside
- Platform updates from YouTube, TikTok, Spotify that affect creators
- Tips and trends in content creation
- What competitors are offering creators
- How Alchify compares for specific use cases

Be practical and creator-focused. What do they need to know today?`
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scrapedData, audience } = await req.json() as { 
      scrapedData: Array<{ source: string; content: string; category: string }>;
      audience: BriefAudience;
    };

    if (!scrapedData || !audience) {
      throw new Error('Missing required fields: scrapedData and audience');
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating ${audience} brief from ${scrapedData.length} sources`);

    // Prepare context from scraped data
    const context = scrapedData.map(d => 
      `### ${d.source} (${d.category})\n${d.content.slice(0, 3000)}`
    ).join('\n\n---\n\n');

    const userPrompt = `Based on the following competitor and platform intelligence gathered today, generate a comprehensive daily brief.

Today's date: ${new Date().toISOString().split('T')[0]}

SCRAPED INTELLIGENCE:
${context}

Generate a JSON response with the following structure:
{
  "title": "Brief title for today",
  "summary": "2-3 sentence executive summary",
  "insights": [
    {"headline": "Key insight headline", "detail": "Detailed explanation", "source": "Source name", "sentiment": "positive|negative|neutral"}
  ],
  "competitor_updates": [
    {"competitor": "Competitor name", "update": "What they did/announced", "impact": "How it affects Alchify"}
  ],
  "market_signals": [
    {"signal": "Market trend or signal", "relevance": "Why it matters to Alchify"}
  ],
  "action_items": [
    {"item": "Recommended action", "priority": "high|medium|low"}
  ]
}

Provide 3-5 items for each array. Be specific and actionable.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: AUDIENCE_PROMPTS[audience] },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response (handle markdown code blocks)
    let briefData;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                        content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      briefData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse brief from AI');
    }

    // Store brief in database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedBrief, error: saveError } = await supabase
      .from('daily_briefs')
      .upsert({
        brief_date: new Date().toISOString().split('T')[0],
        audience,
        title: briefData.title,
        summary: briefData.summary,
        insights: briefData.insights || [],
        competitor_updates: briefData.competitor_updates || [],
        market_signals: briefData.market_signals || [],
        action_items: briefData.action_items || [],
        raw_data: { scrapedSources: scrapedData.map(d => d.source) }
      }, {
        onConflict: 'brief_date,audience'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving brief:', saveError);
      throw saveError;
    }

    console.log(`Successfully generated and saved ${audience} brief`);

    return new Response(
      JSON.stringify({ success: true, brief: savedBrief }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Generate brief error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
