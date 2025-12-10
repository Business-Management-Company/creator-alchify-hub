import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Metric inference patterns
const METRIC_PATTERNS: Record<string, string[]> = {
  time_saved: ['time', 'hours', 'efficiency', 'faster', 'automate', 'workflow', 'productivity'],
  clips_created: ['clip', 'short-form', 'shorts', 'reels', 'tiktok', 'vertical', 'repurpose'],
  words_transcribed: ['transcript', 'transcription', 'speech-to-text', 'captions', 'subtitle'],
  captions_synced: ['caption', 'subtitle', 'accessibility', 'srt', 'vtt'],
  fillers_removed: ['filler', 'um', 'uh', 'like', 'speech cleanup', 'verbal'],
  audio_enhanced: ['audio', 'noise reduction', 'eq', 'loudness', 'normalize', 'sound quality'],
  projects: ['content volume', 'publishing', 'consistency', 'cadence', 'schedule'],
  exports: ['export', 'distribution', 'platform', 'multi-platform', 'cross-post'],
};

async function summarizeDocument(content: string, title: string, apiKey: string): Promise<{
  keyPoints: string[];
  benchmarks: { metric: string; value: string; context: string }[];
  recommendedActions: string[];
  applicableMetrics: string[];
  summary: string;
}> {
  const prompt = `Analyze this content for a creator/podcaster insights database.

Title: ${title}
Content: ${content.slice(0, 8000)}

Extract and return JSON with:
1. "keyPoints": Array of 3-7 key takeaways (short, actionable bullets)
2. "benchmarks": Array of objects with {metric, value, context} for any numbers/stats mentioned (e.g., CPMs, completion rates, episode lengths, growth rates)
3. "recommendedActions": Array of 3-5 specific actions creators could take based on this content
4. "applicableMetrics": Array of which creator metrics this applies to from: [time_saved, clips_created, words_transcribed, captions_synced, fillers_removed, audio_enhanced, projects, exports, accuracy]
5. "summary": 2-3 sentence summary

Focus on practical, actionable insights. Be specific with numbers when available.
Return ONLY valid JSON.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a JSON extraction bot. Return only valid JSON with no markdown." },
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content_response = data.choices[0].message.content;
  
  // Parse JSON from response
  const jsonMatch = content_response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in AI response');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  
  // Infer applicable metrics if not provided
  if (!parsed.applicableMetrics || parsed.applicableMetrics.length === 0) {
    parsed.applicableMetrics = inferApplicableMetrics(content + title);
  }

  return {
    keyPoints: parsed.keyPoints || [],
    benchmarks: parsed.benchmarks || [],
    recommendedActions: parsed.recommendedActions || [],
    applicableMetrics: parsed.applicableMetrics || [],
    summary: parsed.summary || '',
  };
}

function inferApplicableMetrics(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matches: string[] = [];

  for (const [metric, patterns] of Object.entries(METRIC_PATTERNS)) {
    for (const pattern of patterns) {
      if (lowerText.includes(pattern)) {
        matches.push(metric);
        break;
      }
    }
  }

  return matches.length > 0 ? matches : ['projects']; // Default to projects
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sourceId, url, limit = 5 } = await req.json();
    
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('Firecrawl ingest action:', action);

    if (action === 'scrapeSource') {
      // Get source details
      const { data: source, error: sourceError } = await supabase
        .from('insight_sources')
        .select('*')
        .eq('id', sourceId)
        .single();

      if (sourceError || !source) {
        return new Response(
          JSON.stringify({ error: 'Source not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Scraping source: ${source.name} (${source.url})`);

      // Use Firecrawl to scrape the URL
      const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: source.url,
          formats: ['markdown'],
          onlyMainContent: true,
        }),
      });

      if (!scrapeResponse.ok) {
        const errorText = await scrapeResponse.text();
        console.error('Firecrawl error:', errorText);
        return new Response(
          JSON.stringify({ error: 'Firecrawl scrape failed', details: errorText }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const scrapeData = await scrapeResponse.json();
      const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
      const title = scrapeData.data?.metadata?.title || source.name;

      if (!markdown) {
        return new Response(
          JSON.stringify({ error: 'No content scraped' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Summarize with AI
      let aiSummary = null;
      if (LOVABLE_API_KEY) {
        try {
          aiSummary = await summarizeDocument(markdown, title, LOVABLE_API_KEY);
        } catch (e) {
          console.error('AI summarization error:', e);
        }
      }

      // Check if document already exists
      const { data: existing } = await supabase
        .from('insight_documents')
        .select('id')
        .eq('source_id', sourceId)
        .eq('url', source.url)
        .single();

      const documentData = {
        source_id: sourceId,
        title,
        url: source.url,
        published_at: new Date().toISOString(),
        content_markdown: markdown,
        content_summary: aiSummary?.summary || null,
        key_points: aiSummary?.keyPoints || [],
        benchmarks: aiSummary?.benchmarks || [],
        recommended_actions: aiSummary?.recommendedActions || [],
        applicable_metrics: aiSummary?.applicableMetrics || [],
        tags: source.tags || [],
        creator_type_tags: source.creator_type_tags || [],
        topic_tags: source.topic_tags || [],
        is_processed: !!aiSummary,
      };

      if (existing) {
        // Update existing document
        await supabase
          .from('insight_documents')
          .update(documentData)
          .eq('id', existing.id);
      } else {
        // Insert new document
        await supabase
          .from('insight_documents')
          .insert(documentData);
      }

      // Update source last fetch time and count
      const { count } = await supabase
        .from('insight_documents')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', sourceId);

      await supabase
        .from('insight_sources')
        .update({
          last_fetch_at: new Date().toISOString(),
          documents_count: count || 0,
        })
        .eq('id', sourceId);

      return new Response(
        JSON.stringify({
          success: true,
          document: {
            title,
            contentLength: markdown.length,
            keyPoints: aiSummary?.keyPoints?.length || 0,
            benchmarks: aiSummary?.benchmarks?.length || 0,
            applicableMetrics: aiSummary?.applicableMetrics || [],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'scrapeAllActive') {
      // Get all active Firecrawl sources
      const { data: sources, error } = await supabase
        .from('insight_sources')
        .select('id, name, url')
        .eq('type', 'firecrawl')
        .eq('is_active', true);

      if (error) throw error;

      const results = [];
      for (const source of sources || []) {
        try {
          // Recursive call to scrape each source
          const response = await fetch(req.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'scrapeSource', sourceId: source.id }),
          });
          const result = await response.json();
          results.push({ source: source.name, ...result });
        } catch (e) {
          results.push({ source: source.name, error: String(e) });
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Firecrawl ingest error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
