import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompetitorSource {
  id: string;
  name: string;
  url: string;
  category: string;
}

interface ScrapedData {
  source: string;
  url: string;
  category: string;
  content: string;
  scrapedAt: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      throw new Error('Firecrawl API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch active competitor sources
    const { data: sources, error: sourcesError } = await supabase
      .from('competitor_sources')
      .select('*')
      .eq('is_active', true);

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError);
      throw sourcesError;
    }

    console.log(`Scraping ${sources?.length || 0} competitor sources`);

    const scrapedData: ScrapedData[] = [];
    const errors: { source: string; error: string }[] = [];

    // Scrape each source
    for (const source of (sources || []) as CompetitorSource[]) {
      try {
        console.log(`Scraping ${source.name}: ${source.url}`);
        
        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: source.url,
            formats: ['markdown'],
            onlyMainContent: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error(`Firecrawl error for ${source.name}:`, data);
          errors.push({ source: source.name, error: data.error || 'Scrape failed' });
          continue;
        }

        scrapedData.push({
          source: source.name,
          url: source.url,
          category: source.category,
          content: data.data?.markdown || '',
          scrapedAt: new Date().toISOString(),
        });

        // Update last scraped timestamp
        await supabase
          .from('competitor_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);

        // Rate limiting - wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`Error scraping ${source.name}:`, err);
        errors.push({ 
          source: source.name, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        });
      }
    }

    console.log(`Scraped ${scrapedData.length} sources successfully, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scraped: scrapedData.length,
        errors: errors.length,
        data: scrapedData,
        errorDetails: errors 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scrape competitors error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
