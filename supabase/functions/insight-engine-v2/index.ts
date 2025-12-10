import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricInsightRequest {
  userId: string;
  metricKey: string;
  userMetrics: {
    timeSavedHours?: number;
    projectCount?: number;
    clipsCreated?: number;
    wordsTranscribed?: number;
    captionsSynced?: number;
    fillersRemoved?: number;
    pausesCut?: number;
    audioEnhancedPercent?: number;
    exportsCount?: number;
    avgAccuracy?: number;
  };
  creatorType?: 'creator' | 'podcaster' | 'agency';
}

interface StructuredInsightResponse {
  whereYouStand: { text: string; benchmark?: string }[];
  industryPractices: { text: string; source?: string }[];
  inProductCTAs: { label: string; action: string; payload?: any }[];
  suggestedQuestions: string[];
}

// Map metric keys to applicable_metrics array values
const METRIC_KEY_MAP: Record<string, string[]> = {
  'Time Saved': ['time_saved', 'efficiency', 'editing'],
  'Projects': ['projects', 'content_volume', 'consistency'],
  'Exports': ['exports', 'distribution', 'multi_platform'],
  'Avg Accuracy': ['accuracy', 'transcription', 'quality'],
  'Fillers Removed': ['fillers_removed', 'audio_cleanup', 'speech'],
  'Pauses Cut': ['pauses_cut', 'pacing', 'engagement'],
  'Audio Enhanced': ['audio_enhanced', 'audio_quality', 'production'],
  'Clips Created': ['clips_created', 'repurposing', 'short_form'],
  'Words Transcribed': ['words_transcribed', 'transcription', 'content_volume'],
  'Captions Synced': ['captions_synced', 'accessibility', 'seo'],
};

// In-product CTA templates
const CTA_TEMPLATES: Record<string, { label: string; action: string }[]> = {
  'Time Saved': [
    { label: 'Upload New Content', action: 'NAVIGATE:/upload' },
    { label: 'Auto-Process Last Project', action: 'OPEN_REFINER_AUTO' },
    { label: 'Enable Batch Processing', action: 'NAVIGATE:/settings' },
  ],
  'Clips Created': [
    { label: 'Generate 5 New Clips', action: 'OPEN_CLIP_WIZARD' },
    { label: 'Create Vertical Clips', action: 'OPEN_CLIP_WIZARD:vertical' },
    { label: 'View Clip Analytics', action: 'NAVIGATE:/analytics' },
  ],
  'Words Transcribed': [
    { label: 'Transcribe New Content', action: 'NAVIGATE:/upload' },
    { label: 'Improve Accuracy Settings', action: 'NAVIGATE:/settings' },
    { label: 'Export Transcripts', action: 'OPEN_EXPORT_TRANSCRIPTS' },
  ],
  'Captions Synced': [
    { label: 'Add Captions to Project', action: 'OPEN_CAPTION_EDITOR' },
    { label: 'Customize Caption Style', action: 'OPEN_CAPTION_WIZARD' },
    { label: 'Export SRT Files', action: 'OPEN_EXPORT_CAPTIONS' },
  ],
  'Fillers Removed': [
    { label: 'Clean Up New Recording', action: 'NAVIGATE:/upload' },
    { label: 'Adjust Filler Sensitivity', action: 'NAVIGATE:/settings' },
    { label: 'Record in Studio', action: 'NAVIGATE:/studio' },
  ],
  'Audio Enhanced': [
    { label: 'Enhance Audio Now', action: 'OPEN_AUDIO_ENHANCER' },
    { label: 'Apply Noise Reduction', action: 'OPEN_AUDIO_ENHANCER:noise' },
    { label: 'Normalize Volume', action: 'OPEN_AUDIO_ENHANCER:normalize' },
  ],
};

// Suggested questions per metric
const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  'Time Saved': [
    'How can I save even more time with my editing workflow?',
    'What automation features am I not using yet?',
    'How do top creators optimize their content pipeline?',
  ],
  'Clips Created': [
    'How can I turn this episode into a short-form content series?',
    'What clip formats perform best on TikTok vs Reels?',
    'How many clips should I create per long-form video?',
  ],
  'Words Transcribed': [
    'How can I repurpose my transcripts into blog posts?',
    'What\'s the best way to improve transcription accuracy?',
    'Can I use my transcripts for SEO optimization?',
  ],
  'Captions Synced': [
    'What caption styles perform best for engagement?',
    'How do I add animated word-by-word captions?',
    'Should I use different caption styles per platform?',
  ],
  'Fillers Removed': [
    'How can I speak with fewer filler words naturally?',
    'What\'s an acceptable filler word rate for podcasts?',
    'Does removing all fillers sound too robotic?',
  ],
  'Audio Enhanced': [
    'What audio settings work best for my niche?',
    'How do I achieve studio-quality sound at home?',
    'Should I add background music to my content?',
  ],
};

async function queryInsightCorpus(
  supabase: any,
  metricKey: string,
  creatorType: string,
  limit: number = 5
) {
  const applicableMetrics = METRIC_KEY_MAP[metricKey] || [metricKey.toLowerCase().replace(/\s+/g, '_')];
  
  // Query documents that match the metric and creator type
  const { data: documents, error } = await supabase
    .from('insight_documents')
    .select('*')
    .eq('is_processed', true)
    .overlaps('applicable_metrics', applicableMetrics)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error querying insight corpus:', error);
    return [];
  }

  // Filter by creator type if available
  if (creatorType && documents) {
    return documents.filter((doc: any) => 
      doc.creator_type_tags?.includes(creatorType) || 
      doc.creator_type_tags?.length === 0
    );
  }

  return documents || [];
}

function buildWhereYouStandSection(
  metricKey: string,
  userValue: number | string,
  documents: any[]
): { text: string; benchmark?: string }[] {
  const bullets: { text: string; benchmark?: string }[] = [];
  
  // Extract benchmarks from documents
  const benchmarks = documents.flatMap((doc: any) => doc.benchmarks || []);
  
  // Add user's current position
  bullets.push({
    text: `Your current ${metricKey.toLowerCase()}: ${userValue}`,
  });

  // Add industry comparisons if we have benchmarks
  if (benchmarks.length > 0) {
    const relevantBenchmark = benchmarks[0];
    bullets.push({
      text: `Industry average for creators in your category is typically ${relevantBenchmark.value || 'higher'}`,
      benchmark: relevantBenchmark.source,
    });
  }

  // Add contextual comparison
  const numericValue = typeof userValue === 'string' 
    ? parseFloat(userValue.replace(/[^0-9.]/g, '')) 
    : userValue;
    
  if (numericValue > 0) {
    bullets.push({
      text: `You're on track! Consistent improvement in this metric correlates with 2-3× faster audience growth.`,
    });
  } else {
    bullets.push({
      text: `Getting started here will unlock significant efficiency gains as you build your content library.`,
    });
  }

  return bullets;
}

function buildIndustryPracticesSection(documents: any[]): { text: string; source?: string }[] {
  const practices: { text: string; source?: string }[] = [];
  
  // Extract key points and recommended actions from documents
  for (const doc of documents.slice(0, 3)) {
    const keyPoints = doc.key_points || [];
    const recommendedActions = doc.recommended_actions || [];
    
    // Add up to 2 key points per document
    for (const point of keyPoints.slice(0, 2)) {
      practices.push({
        text: typeof point === 'string' ? point : point.text || point.point,
        source: doc.title,
      });
    }
    
    // Add 1 recommended action per document
    if (recommendedActions.length > 0) {
      const action = recommendedActions[0];
      practices.push({
        text: `Creators like you are seeing results when they ${typeof action === 'string' ? action : action.text || action.action}`,
        source: doc.title,
      });
    }
  }

  // Fallback if no documents
  if (practices.length === 0) {
    practices.push(
      { text: 'Top creators in your niche prioritize consistent publishing schedules.' },
      { text: 'Repurposing long-form content into clips is the #1 growth strategy.' },
      { text: 'Audio quality improvements correlate with higher listener retention.' },
    );
  }

  return practices.slice(0, 5);
}

function buildInProductCTAs(metricKey: string, userMetrics: any): { label: string; action: string; payload?: any }[] {
  const templates = CTA_TEMPLATES[metricKey] || CTA_TEMPLATES['Time Saved'];
  
  return templates.map(cta => ({
    ...cta,
    payload: { metricKey, ...userMetrics },
  }));
}

function buildSuggestedQuestions(metricKey: string): string[] {
  return SUGGESTED_QUESTIONS[metricKey] || [
    `How can I improve my ${metricKey.toLowerCase()}?`,
    'What are the best practices for creators in my niche?',
    'What experiment should I try this week?',
  ];
}

async function generateAIEnhancedResponse(
  baseResponse: StructuredInsightResponse,
  metricKey: string,
  userMetrics: any,
  documents: any[],
  apiKey: string
): Promise<StructuredInsightResponse> {
  const prompt = `You are Refiner AI, a smart content optimization assistant for creators.

Based on this creator's ${metricKey} metric and industry data, enhance these insights:

User's ${metricKey}: ${userMetrics[metricKey.toLowerCase().replace(/\s+/g, '')] || 'N/A'}

Industry context from our corpus:
${documents.slice(0, 3).map(d => `- ${d.title}: ${d.content_summary || d.key_points?.join(', ') || ''}`).join('\n')}

Current insights to enhance:
${JSON.stringify(baseResponse, null, 2)}

Improve the "whereYouStand" and "industryPractices" sections with:
1. More specific, actionable language
2. Concrete numbers when available
3. Encouraging but realistic tone
4. Direct tie-ins to what the user can do in Alchify

Return ONLY valid JSON in the same structure. Keep it concise and punchy.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a JSON-only response bot. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse the AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        return {
          ...baseResponse,
          whereYouStand: enhanced.whereYouStand || baseResponse.whereYouStand,
          industryPractices: enhanced.industryPractices || baseResponse.industryPractices,
        };
      }
    }
  } catch (e) {
    console.error('AI enhancement error:', e);
  }

  return baseResponse;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, metricKey, userMetrics, creatorType = 'creator' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('Insight Engine request:', { action, metricKey, creatorType });

    if (action === 'getMetricInsight') {
      // Query the insight corpus for relevant documents
      const documents = await queryInsightCorpus(supabase, metricKey, creatorType);
      
      console.log(`Found ${documents.length} relevant documents for ${metricKey}`);

      // Get user's current value for this metric
      const metricKeyNormalized = metricKey.toLowerCase().replace(/\s+/g, '');
      const userValue = userMetrics?.[metricKeyNormalized] || userMetrics?.[metricKey] || 0;

      // Build the structured response
      let response: StructuredInsightResponse = {
        whereYouStand: buildWhereYouStandSection(metricKey, userValue, documents),
        industryPractices: buildIndustryPracticesSection(documents),
        inProductCTAs: buildInProductCTAs(metricKey, userMetrics),
        suggestedQuestions: buildSuggestedQuestions(metricKey),
      };

      // Enhance with AI if we have the API key and documents
      if (LOVABLE_API_KEY && documents.length > 0) {
        response = await generateAIEnhancedResponse(
          response,
          metricKey,
          userMetrics,
          documents,
          LOVABLE_API_KEY
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: response }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getInsights') {
      // Return all insights for dashboard (existing functionality)
      const { data: documents } = await supabase
        .from('insight_documents')
        .select('*')
        .eq('is_processed', true)
        .order('published_at', { ascending: false })
        .limit(20);

      return new Response(
        JSON.stringify({ 
          success: true, 
          documents: documents || [],
          count: documents?.length || 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Insight Engine error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
