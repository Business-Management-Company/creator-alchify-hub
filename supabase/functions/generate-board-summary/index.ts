import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      creatorsYear1,
      creatorsYear2,
      creatorsYear3,
      year1Revenue,
      year2Revenue,
      year3Revenue,
      year3GrossMarginPercent,
      year3Ebitda,
      year3EbitdaMarginPercent,
      fixedCostsYear1,
      fixedCostsYear2,
      fixedCostsYear3,
      cumulativeCashEndYear1,
      cumulativeCashEndYear2,
      cumulativeCashEndYear3,
      breakEvenYearLabel,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const formatCurrency = (value: number) => {
      if (Math.abs(value) >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(value) >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
      return `$${value.toFixed(0)}`;
    };

    const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

    const userPrompt = `You are helping Alchify prepare a 3-year creator-economy forecast for the Board.

Here are the key numbers:
- Year 1 Creators: ${Math.round(creatorsYear1).toLocaleString()}
- Year 2 Creators: ${Math.round(creatorsYear2).toLocaleString()}
- Year 3 Creators: ${Math.round(creatorsYear3).toLocaleString()}

- Year 1 Revenue: ${formatCurrency(year1Revenue)}
- Year 2 Revenue: ${formatCurrency(year2Revenue)}
- Year 3 Revenue: ${formatCurrency(year3Revenue)}

- Year 3 Gross Margin: ${formatPercent(year3GrossMarginPercent)}
- Year 3 EBITDA: ${formatCurrency(year3Ebitda)}
- Year 3 EBITDA Margin: ${formatPercent(year3EbitdaMarginPercent)}

- Fixed Costs Year 1: ${formatCurrency(fixedCostsYear1)}
- Fixed Costs Year 2: ${formatCurrency(fixedCostsYear2)}
- Fixed Costs Year 3: ${formatCurrency(fixedCostsYear3)}

- Cumulative Cash after Year 1: ${formatCurrency(cumulativeCashEndYear1)}
- Cumulative Cash after Year 2: ${formatCurrency(cumulativeCashEndYear2)}
- Cumulative Cash after Year 3: ${formatCurrency(cumulativeCashEndYear3)}
- Break-even Year: ${breakEvenYearLabel}

Write a short board-ready summary (250–350 words) that:
1) Explains the overall growth story.
2) Highlights when and how we reach profitability.
3) Calls out 2–3 key sensitivities (creators, price, AI cost).
4) Uses short paragraphs, plain English, and no jargon.

End with a simple bullet list titled "What the Board Should Watch" with 3 bullets.`;

    console.log('Generating board summary with Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert startup CFO who explains numbers simply. Write in clear, concise language an 8th-grader could understand. Be factual and straightforward. Do not use corporate buzzwords or jargon.',
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required, please add funds to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || 'Unable to generate summary.';

    console.log('Board summary generated successfully');

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating board summary:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
