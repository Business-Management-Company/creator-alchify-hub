import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RSSItem {
  title: string;
  link: string;
  pubDate?: string;
  description?: string;
  content?: string;
  enclosure?: { url: string; type: string };
}

async function parseRSSFeed(url: string): Promise<RSSItem[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  const xml = await response.text();
  const items: RSSItem[] = [];

  // Simple XML parsing for RSS items
  const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const itemXml of itemMatches) {
    const title = itemXml.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || '';
    const link = itemXml.match(/<link[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i)?.[1]?.trim() || '';
    const pubDate = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim();
    const description = itemXml.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim();
    const content = itemXml.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i)?.[1]?.trim();
    
    // Parse enclosure for audio/video
    const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']([^"']+)["'][^>]*\/?>/i);
    const enclosure = enclosureMatch ? { url: enclosureMatch[1], type: enclosureMatch[2] } : undefined;

    if (title && link) {
      items.push({ title, link, pubDate, description, content, enclosure });
    }
  }

  return items;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function summarizeDocument(content: string, title: string, apiKey: string) {
  const prompt = `Analyze this podcast/creator content for insights.

Title: ${title}
Content: ${content.slice(0, 8000)}

Extract and return JSON with:
1. "keyPoints": Array of 3-7 key takeaways
2. "benchmarks": Array of {metric, value, context} for any stats mentioned
3. "recommendedActions": Array of 3-5 specific actions for creators
4. "applicableMetrics": Array from [time_saved, clips_created, words_transcribed, captions_synced, fillers_removed, audio_enhanced, projects, exports]
5. "summary": 2-3 sentence summary

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
        { role: "system", content: "Return only valid JSON with no markdown." },
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, sourceId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log('RSS ingest action:', action);

    if (action === 'fetchSource') {
      // Get source details
      const { data: source, error: sourceError } = await supabase
        .from('insight_sources')
        .select('*')
        .eq('id', sourceId)
        .eq('type', 'rss')
        .single();

      if (sourceError || !source) {
        return new Response(
          JSON.stringify({ error: 'RSS source not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Fetching RSS: ${source.name} (${source.url})`);

      // Parse the RSS feed
      const items = await parseRSSFeed(source.url);
      console.log(`Found ${items.length} items in feed`);

      let processedCount = 0;
      let skippedCount = 0;

      for (const item of items.slice(0, 10)) { // Process up to 10 items per fetch
        // Check if we already have this document
        const { data: existing } = await supabase
          .from('insight_documents')
          .select('id')
          .eq('source_id', sourceId)
          .eq('url', item.link)
          .single();

        if (existing) {
          skippedCount++;
          continue;
        }

        // Get content from description or content:encoded
        const rawContent = item.content || item.description || '';
        const cleanContent = stripHtml(rawContent);

        // Summarize with AI
        let aiSummary = null;
        if (LOVABLE_API_KEY && cleanContent.length > 100) {
          try {
            aiSummary = await summarizeDocument(cleanContent, item.title, LOVABLE_API_KEY);
          } catch (e) {
            console.error('AI summarization error:', e);
          }
        }

        // Insert new document
        const { error: insertError } = await supabase
          .from('insight_documents')
          .insert({
            source_id: sourceId,
            title: item.title,
            url: item.link,
            published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
            content_markdown: cleanContent,
            content_summary: aiSummary?.summary || null,
            key_points: aiSummary?.keyPoints || [],
            benchmarks: aiSummary?.benchmarks || [],
            recommended_actions: aiSummary?.recommendedActions || [],
            applicable_metrics: aiSummary?.applicableMetrics || [],
            tags: source.tags || [],
            creator_type_tags: source.creator_type_tags || [],
            topic_tags: source.topic_tags || [],
            is_processed: !!aiSummary,
          });

        if (!insertError) {
          processedCount++;
        }
      }

      // Update source metadata
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
          processed: processedCount,
          skipped: skippedCount,
          totalInFeed: items.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'fetchAllActive') {
      // Get all active RSS sources
      const { data: sources, error } = await supabase
        .from('insight_sources')
        .select('id, name')
        .eq('type', 'rss')
        .eq('is_active', true);

      if (error) throw error;

      const results = [];
      for (const source of sources || []) {
        try {
          const response = await fetch(req.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetchSource', sourceId: source.id }),
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
    console.error('RSS ingest error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
