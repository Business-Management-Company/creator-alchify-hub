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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting daily brief pipeline...');

    // Step 1: Scrape all competitors
    console.log('Step 1: Scraping competitors...');
    const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/scrape-competitors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const scrapeResult = await scrapeResponse.json();
    
    if (!scrapeResult.success) {
      console.error('Scrape failed:', scrapeResult.error);
      throw new Error(`Scraping failed: ${scrapeResult.error}`);
    }

    console.log(`Scraped ${scrapeResult.scraped} sources`);

    const scrapedData = scrapeResult.data || [];

    if (scrapedData.length === 0) {
      console.log('No data scraped, generating briefs with empty context');
    }

    // Step 2: Generate briefs for each audience
    const audiences = ['ceo', 'board', 'investor', 'creator'] as const;
    const results: Record<string, { success: boolean; error?: string }> = {};

    for (const audience of audiences) {
      console.log(`Step 2: Generating ${audience} brief...`);
      
      try {
        const briefResponse = await fetch(`${supabaseUrl}/functions/v1/generate-daily-brief`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scrapedData, audience }),
        });

        const briefResult = await briefResponse.json();
        
        if (briefResult.success) {
          results[audience] = { success: true };
          console.log(`Successfully generated ${audience} brief`);
        } else {
          results[audience] = { success: false, error: briefResult.error };
          console.error(`Failed to generate ${audience} brief:`, briefResult.error);
        }
      } catch (err) {
        results[audience] = { 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        };
        console.error(`Error generating ${audience} brief:`, err);
      }

      // Small delay between generations to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const successCount = Object.values(results).filter(r => r.success).length;
    console.log(`Pipeline complete: ${successCount}/${audiences.length} briefs generated`);

    return new Response(
      JSON.stringify({
        success: true,
        scraped: scrapeResult.scraped,
        scrapeErrors: scrapeResult.errors,
        briefs: results,
        summary: `Generated ${successCount}/${audiences.length} briefs from ${scrapeResult.scraped} sources`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pipeline error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
