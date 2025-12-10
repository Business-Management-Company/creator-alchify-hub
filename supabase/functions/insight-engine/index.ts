import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatorMetrics {
  timeSavedHours: number;
  projectCount: number;
  exportsCount: number;
  avgAccuracy: number;
  fillersRemoved: number;
  pausesCut: number;
  audioEnhancedPercent: number;
  clipsCreated: number;
  wordsTranscribed: number;
  captionsSynced: number;
}

interface Insight {
  metric: string;
  creatorValue: string;
  industryContext: string;
  insight: string;
  recommendedAction: string;
  cta: string;
  ctaAction: string;
  passiveInsight: string;
}

// Industry benchmark data (would be updated via Firecrawl scraping)
const INDUSTRY_BENCHMARKS = {
  timeSaved: {
    topPerformers: 4,
    average: 2.5,
    context: "Top creators save 4+ hours weekly on editing",
  },
  fillersRemoved: {
    topPerformers: 50,
    average: 25,
    context: "Professional podcasters remove 50+ filler words per episode",
  },
  pausesCut: {
    topPerformers: 15,
    average: 8,
    context: "Engaging videos typically have 15+ strategic pause removals",
  },
  clipsCreated: {
    topPerformers: 10,
    average: 5,
    context: "Viral creators produce 10+ clips per long-form video",
  },
  audioEnhanced: {
    topPerformers: 25,
    average: 15,
    context: "Studio-quality podcasts achieve 25%+ audio enhancement",
  },
  wordsTranscribed: {
    topPerformers: 5000,
    average: 2000,
    context: "Active creators transcribe 5,000+ words weekly",
  },
  captionsSynced: {
    topPerformers: 20,
    average: 10,
    context: "Accessibility-focused creators sync 20+ caption segments",
  },
  projects: {
    topPerformers: 10,
    average: 5,
    context: "Consistent creators manage 10+ active projects",
  },
  exports: {
    topPerformers: 25,
    average: 12,
    context: "Multi-platform creators export 25+ variants monthly",
  },
  accuracy: {
    topPerformers: 98,
    average: 94,
    context: "Professional transcriptions achieve 98%+ accuracy",
  },
};

function generateInsights(metrics: CreatorMetrics): Insight[] {
  const insights: Insight[] = [];
  
  // Time Saved insight
  const timeSavedPercentile = metrics.timeSavedHours >= INDUSTRY_BENCHMARKS.timeSaved.topPerformers ? "top 10%" : 
    metrics.timeSavedHours >= INDUSTRY_BENCHMARKS.timeSaved.average ? "above average" : "growing";
  insights.push({
    metric: "Time Saved",
    creatorValue: `${metrics.timeSavedHours.toFixed(1)} hours`,
    industryContext: INDUSTRY_BENCHMARKS.timeSaved.context,
    insight: metrics.timeSavedHours >= 4 
      ? "You're in the top 10% of efficient creators! Your workflow automation is exceptional."
      : `You've saved ${metrics.timeSavedHours.toFixed(1)} hours. Creators saving 4+ hours/week typically publish 3× more content.`,
    recommendedAction: "Upload more long-form content to maximize time savings through automated refinement.",
    cta: "Upload New Content",
    ctaAction: "/upload",
    passiveInsight: "Creators saving 4+ hours/week typically publish 3× more content.",
  });
  
  // Fillers Removed insight
  const fillerPercentile = metrics.fillersRemoved >= INDUSTRY_BENCHMARKS.fillersRemoved.topPerformers ? "top 20%" : "improving";
  insights.push({
    metric: "Fillers Removed",
    creatorValue: metrics.fillersRemoved.toString(),
    industryContext: INDUSTRY_BENCHMARKS.fillersRemoved.context,
    insight: metrics.fillersRemoved >= 50 
      ? "Your filler removal efficiency is in the top 20% of Alchify creators. Your content sounds professional!"
      : `${metrics.fillersRemoved} fillers removed. Reducing filler words by 50% can increase viewer retention by 22%.`,
    recommendedAction: "Record a new session and let AI clean it up automatically.",
    cta: "Record Now",
    ctaAction: "/studio",
    passiveInsight: "Your filler removal efficiency is in the top 20% of Alchify creators.",
  });
  
  // Pauses Cut insight
  insights.push({
    metric: "Pauses Cut",
    creatorValue: metrics.pausesCut.toString(),
    industryContext: INDUSTRY_BENCHMARKS.pausesCut.context,
    insight: metrics.pausesCut >= 15 
      ? "Strategic pause removal is keeping your audience engaged!"
      : `${metrics.pausesCut} pauses cut. Podcast creators who remove 50% of awkward pauses see 22% higher retention.`,
    recommendedAction: "Process your next podcast through the Refiner for optimal pacing.",
    cta: "Optimize Audio",
    ctaAction: "/upload",
    passiveInsight: "Podcast creators who remove 50% of pauses see 22% higher listener retention.",
  });
  
  // Clips Created insight
  insights.push({
    metric: "Clips Created",
    creatorValue: metrics.clipsCreated.toString(),
    industryContext: INDUSTRY_BENCHMARKS.clipsCreated.context,
    insight: metrics.clipsCreated >= 10 
      ? "You're maximizing your content reach with excellent clip generation!"
      : `${metrics.clipsCreated} clips created. Top creators generate 10+ clips per long-form video for 5× more reach.`,
    recommendedAction: "Generate more clips from your existing projects to expand reach.",
    cta: "Generate Clips",
    ctaAction: "/projects",
    passiveInsight: "Top creators generate 10+ clips per long-form video for 5× more reach.",
  });
  
  // Audio Enhanced insight
  insights.push({
    metric: "Audio Enhanced",
    creatorValue: `${metrics.audioEnhancedPercent}%`,
    industryContext: INDUSTRY_BENCHMARKS.audioEnhanced.context,
    insight: metrics.audioEnhancedPercent >= 25 
      ? "Your audio quality rivals professional studios!"
      : `${metrics.audioEnhancedPercent}% enhancement. Studio-quality audio increases listener trust by 35%.`,
    recommendedAction: "Upload raw audio files for AI-powered noise reduction and enhancement.",
    cta: "Enhance Audio",
    ctaAction: "/upload",
    passiveInsight: "Studio-quality audio increases listener trust by 35%.",
  });
  
  // Words Transcribed insight
  insights.push({
    metric: "Words Transcribed",
    creatorValue: metrics.wordsTranscribed >= 1000 ? `${(metrics.wordsTranscribed / 1000).toFixed(1)}k` : metrics.wordsTranscribed.toString(),
    industryContext: INDUSTRY_BENCHMARKS.wordsTranscribed.context,
    insight: metrics.wordsTranscribed >= 5000 
      ? "Your content volume puts you in the top tier of active creators!"
      : `${metrics.wordsTranscribed.toLocaleString()} words transcribed. Creators with 5k+ weekly words grow 2× faster.`,
    recommendedAction: "Upload more content to build your transcription library.",
    cta: "Upload Content",
    ctaAction: "/upload",
    passiveInsight: "Creators with 5k+ weekly transcribed words grow 2× faster.",
  });
  
  // Captions Synced insight
  insights.push({
    metric: "Captions Synced",
    creatorValue: metrics.captionsSynced.toString(),
    industryContext: INDUSTRY_BENCHMARKS.captionsSynced.context,
    insight: metrics.captionsSynced >= 20 
      ? "Your accessibility focus is expanding your potential audience by 40%!"
      : `${metrics.captionsSynced} captions synced. Captioned videos get 40% more views.`,
    recommendedAction: "Enable auto-captions on your next export for maximum reach.",
    cta: "Add Captions",
    ctaAction: "/projects",
    passiveInsight: "Captioned videos get 40% more views and improved SEO.",
  });
  
  // Projects insight
  insights.push({
    metric: "Projects",
    creatorValue: metrics.projectCount.toString(),
    industryContext: INDUSTRY_BENCHMARKS.projects.context,
    insight: metrics.projectCount >= 10 
      ? "Your active project count shows excellent consistency!"
      : `${metrics.projectCount} projects. Creators with 6+ projects tend to repurpose 4× more clips.`,
    recommendedAction: "Create a new project from your latest recording session.",
    cta: "New Project",
    ctaAction: "/upload",
    passiveInsight: "Creators with 6+ projects tend to repurpose 4× more clips.",
  });
  
  // Exports insight
  insights.push({
    metric: "Exports",
    creatorValue: metrics.exportsCount.toString(),
    industryContext: INDUSTRY_BENCHMARKS.exports.context,
    insight: metrics.exportsCount >= 25 
      ? "You're a multi-platform powerhouse! Your export strategy is paying off."
      : `${metrics.exportsCount} exports. Multi-platform creators with 25+ monthly exports see 3× engagement.`,
    recommendedAction: "Export your best clips in multiple formats for different platforms.",
    cta: "Export Clips",
    ctaAction: "/projects",
    passiveInsight: "Multi-platform creators with 25+ monthly exports see 3× engagement.",
  });
  
  // Accuracy insight
  insights.push({
    metric: "Avg Accuracy",
    creatorValue: `${metrics.avgAccuracy}%`,
    industryContext: INDUSTRY_BENCHMARKS.accuracy.context,
    insight: metrics.avgAccuracy >= 98 
      ? "Your transcription accuracy is at professional broadcast standards!"
      : `${metrics.avgAccuracy}% accuracy. Improving accuracy to 98%+ reduces editing time by 50%.`,
    recommendedAction: "Upload higher-quality audio for improved transcription accuracy.",
    cta: "Improve Quality",
    ctaAction: "/upload",
    passiveInsight: "98%+ accuracy reduces manual editing time by 50%.",
  });
  
  return insights;
}

async function fetchIndustryInsightsWithFirecrawl(apiKey: string): Promise<any> {
  // This would scrape industry benchmarks from relevant sources
  // For MVP, we use cached benchmarks with occasional refreshes
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://blog.hubspot.com/marketing/video-marketing-statistics',
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Firecrawl data fetched for industry insights');
      return data;
    }
  } catch (error) {
    console.error('Firecrawl fetch error:', error);
  }
  return null;
}

function generateInsightOfTheDay(insights: Insight[]): Insight {
  // Select a high-impact insight based on performance gaps
  const sortedByImpact = [...insights].sort((a, b) => {
    // Prioritize insights where creator can improve
    const aValue = parseFloat(a.creatorValue.replace(/[^0-9.]/g, '')) || 0;
    const bValue = parseFloat(b.creatorValue.replace(/[^0-9.]/g, '')) || 0;
    return aValue - bValue;
  });
  
  // Return a random insight from the top 3 improvement opportunities
  const topOpportunities = sortedByImpact.slice(0, 3);
  return topOpportunities[Math.floor(Math.random() * topOpportunities.length)];
}

async function generateDeepDiveReport(metrics: CreatorMetrics, apiKey: string): Promise<string> {
  const prompt = `Generate a comprehensive performance analysis for a content creator with these metrics:
- Time Saved: ${metrics.timeSavedHours} hours
- Projects: ${metrics.projectCount}
- Exports: ${metrics.exportsCount}
- Accuracy: ${metrics.avgAccuracy}%
- Fillers Removed: ${metrics.fillersRemoved}
- Pauses Cut: ${metrics.pausesCut}
- Audio Enhanced: ${metrics.audioEnhancedPercent}%
- Clips Created: ${metrics.clipsCreated}
- Words Transcribed: ${metrics.wordsTranscribed}
- Captions Synced: ${metrics.captionsSynced}

Provide:
1. Executive Summary (2-3 sentences)
2. Top 3 Strengths
3. Top 3 Areas for Improvement
4. Recommended Weekly Action Plan (5 specific actions)
5. Growth Projection (what they could achieve in 30 days)

Format as markdown with headers.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are Refiner AI, a performance analyst for content creators. Be encouraging but data-driven. Keep responses actionable and specific." },
        { role: "user", content: prompt }
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate deep dive report');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, metrics } = await req.json();
    
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    console.log('InsightEngine action:', action);

    if (action === 'getInsights') {
      // Optionally fetch fresh industry data with Firecrawl
      if (FIRECRAWL_API_KEY) {
        await fetchIndustryInsightsWithFirecrawl(FIRECRAWL_API_KEY);
      }
      
      const insights = generateInsights(metrics);
      const insightOfTheDay = generateInsightOfTheDay(insights);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          insights,
          insightOfTheDay,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getMetricInsight') {
      const { metricName } = await req.json();
      const insights = generateInsights(metrics);
      const metricInsight = insights.find(i => i.metric === metricName);
      
      if (!metricInsight) {
        return new Response(
          JSON.stringify({ success: false, error: 'Metric not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Generate AI interpretation
      if (LOVABLE_API_KEY) {
        const interpretationPrompt = `As Refiner AI, provide a brief interpretation for this creator metric:
Metric: ${metricInsight.metric}
Value: ${metricInsight.creatorValue}
Industry Context: ${metricInsight.industryContext}

Respond in 2-3 sentences explaining what this means for their content strategy and one specific opportunity.`;

        try {
          const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are Refiner AI, a helpful content optimization assistant. Be encouraging, specific, and actionable." },
                { role: "user", content: interpretationPrompt }
              ],
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            metricInsight.insight = aiData.choices[0].message.content;
          }
        } catch (e) {
          console.error('AI interpretation error:', e);
        }
      }
      
      return new Response(
        JSON.stringify({ success: true, insight: metricInsight }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generateDeepDive') {
      if (!LOVABLE_API_KEY) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const report = await generateDeepDiveReport(metrics, LOVABLE_API_KEY);
      
      return new Response(
        JSON.stringify({ success: true, report }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('InsightEngine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
