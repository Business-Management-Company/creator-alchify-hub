import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== REQUEST SHAPE ==========
interface InsightRequest {
  userId: string;
  metricKey: string; // e.g. "time_saved", "clips_created", "words_transcribed"
  timeRange?: {
    from: string;
    to: string;
  };
  context?: {
    creatorType?: 'creator' | 'podcaster' | 'agency';
    primaryCategory?: string;
    projectId?: string;
  };
}

// ========== RESPONSE SHAPE ==========
interface UserStats {
  value: number;
  unit: string;
  period: string;
  trend: 'up' | 'down' | 'flat';
  trendPercent: number | null;
}

interface Benchmark {
  label: string;
  value: number;
  unit: string;
  direction: 'target_above' | 'target_below' | 'informational';
}

interface WhereYouStand {
  userStats: UserStats;
  benchmarks: Benchmark[];
  takeaways: string[];
}

interface IndustryPracticeItem {
  title: string;
  description: string;
  sourceHints: string[];
}

interface IndustryPractices {
  summary: string;
  items: IndustryPracticeItem[];
}

interface InProductCTA {
  label: string;
  description: string;
  priority: number;
  action: string;
  payload: Record<string, any>;
}

interface DebugInfo {
  documentsUsed: { id: string; source: string; weight: number }[];
}

interface InsightResponse {
  metricKey: string;
  summary: {
    headline: string;
    oneLiner: string;
  };
  whereYouStand: WhereYouStand;
  industryPractices: IndustryPractices;
  inProductCTAs: InProductCTA[];
  suggestedQuestions: string[];
  debug?: DebugInfo;
}

// Map metric keys to applicable_metrics array values
const METRIC_KEY_MAP: Record<string, string[]> = {
  'time_saved': ['time_saved', 'efficiency', 'editing'],
  'projects': ['projects', 'content_volume', 'consistency'],
  'exports': ['exports', 'distribution', 'multi_platform'],
  'accuracy': ['accuracy', 'transcription', 'quality'],
  'fillers_removed': ['fillers_removed', 'audio_cleanup', 'speech'],
  'pauses_cut': ['pauses_cut', 'pacing', 'engagement'],
  'audio_enhanced': ['audio_enhanced', 'audio_quality', 'production'],
  'clips_created': ['clips_created', 'repurposing', 'short_form'],
  'words_transcribed': ['words_transcribed', 'transcription', 'content_volume'],
  'captions_synced': ['captions_synced', 'accessibility', 'seo'],
};

// Metric display config
const METRIC_CONFIG: Record<string, { unit: string; benchmarkValue: number; benchmarkLabel: string }> = {
  'time_saved': { unit: 'hours', benchmarkValue: 6, benchmarkLabel: 'Similar podcasters using AI weekly' },
  'projects': { unit: 'projects', benchmarkValue: 8, benchmarkLabel: 'Active creators per month' },
  'exports': { unit: 'exports', benchmarkValue: 20, benchmarkLabel: 'Top creators per month' },
  'accuracy': { unit: '%', benchmarkValue: 95, benchmarkLabel: 'Industry standard accuracy' },
  'fillers_removed': { unit: 'words', benchmarkValue: 150, benchmarkLabel: 'Avg per episode for clean audio' },
  'pauses_cut': { unit: 'seconds', benchmarkValue: 30, benchmarkLabel: 'Avg removed per episode' },
  'audio_enhanced': { unit: '%', benchmarkValue: 100, benchmarkLabel: 'Episodes with enhancement' },
  'clips_created': { unit: 'clips', benchmarkValue: 10, benchmarkLabel: 'Top shows per episode' },
  'words_transcribed': { unit: 'words', benchmarkValue: 50000, benchmarkLabel: 'Monthly active creators' },
  'captions_synced': { unit: 'minutes', benchmarkValue: 60, benchmarkLabel: 'Accessible content per week' },
};

// In-product CTA templates
const CTA_TEMPLATES: Record<string, InProductCTA[]> = {
  'time_saved': [
    { label: 'Run AI cleanup on your last 3 uploads', description: 'Free up ~2–3 more hours this week by batch-processing existing projects.', priority: 1, action: 'OPEN_REFINER_BATCH', payload: { limit: 3 } },
    { label: 'Auto-generate 5 vertical clips', description: 'Turn your latest episode into a short-form series for Reels/Shorts/TikTok.', priority: 2, action: 'OPEN_CLIP_WIZARD', payload: { clipCount: 5 } },
    { label: 'Enable batch processing', description: 'Process multiple projects automatically to save even more time.', priority: 3, action: 'NAVIGATE:/settings', payload: {} },
  ],
  'clips_created': [
    { label: 'Generate 5 New Clips', description: 'Create vertical clips optimized for social platforms.', priority: 1, action: 'OPEN_CLIP_WIZARD', payload: { clipCount: 5 } },
    { label: 'Try different aspect ratios', description: 'Test 1:1, 9:16, and 16:9 formats for different platforms.', priority: 2, action: 'OPEN_CLIP_WIZARD', payload: { showFormats: true } },
    { label: 'View clip analytics', description: 'See which clip styles perform best for your audience.', priority: 3, action: 'NAVIGATE:/analytics', payload: {} },
  ],
  'words_transcribed': [
    { label: 'Transcribe new content', description: 'Add more content to build your searchable library.', priority: 1, action: 'NAVIGATE:/upload', payload: {} },
    { label: 'Export transcripts as blog posts', description: 'Repurpose your audio into written content.', priority: 2, action: 'OPEN_EXPORT_TRANSCRIPTS', payload: {} },
    { label: 'Improve accuracy settings', description: 'Fine-tune transcription for your speaking style.', priority: 3, action: 'NAVIGATE:/settings', payload: {} },
  ],
  'captions_synced': [
    { label: 'Add captions to latest project', description: 'Boost accessibility and engagement with synced captions.', priority: 1, action: 'OPEN_CAPTION_EDITOR', payload: {} },
    { label: 'Customize caption style', description: 'Match your brand with animated word-by-word captions.', priority: 2, action: 'OPEN_CAPTION_WIZARD', payload: {} },
    { label: 'Export SRT/VTT files', description: 'Download caption files for any platform.', priority: 3, action: 'OPEN_EXPORT_CAPTIONS', payload: {} },
  ],
  'fillers_removed': [
    { label: 'Clean up new recording', description: 'Remove ums, ahs, and filler words automatically.', priority: 1, action: 'NAVIGATE:/upload', payload: {} },
    { label: 'Adjust filler sensitivity', description: 'Fine-tune detection for your speaking style.', priority: 2, action: 'NAVIGATE:/settings', payload: {} },
    { label: 'Record in Studio', description: 'Get cleaner audio from the start.', priority: 3, action: 'NAVIGATE:/studio', payload: {} },
  ],
  'audio_enhanced': [
    { label: 'Enhance audio now', description: 'Apply professional audio cleanup in one click.', priority: 1, action: 'OPEN_AUDIO_ENHANCER', payload: {} },
    { label: 'Apply noise reduction', description: 'Remove background noise for clearer audio.', priority: 2, action: 'OPEN_AUDIO_ENHANCER', payload: { mode: 'noise' } },
    { label: 'Normalize volume levels', description: 'Balance audio across your entire episode.', priority: 3, action: 'OPEN_AUDIO_ENHANCER', payload: { mode: 'normalize' } },
  ],
};

// Suggested questions per metric
const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  'time_saved': [
    'How can I use Refiner AI to save at least 2 more hours per week?',
    'What clip formats work best for my type of show?',
    'Which part of my workflow should I automate next?',
    'Help me design a weekly editing routine using Refiner AI.',
  ],
  'clips_created': [
    'How can I turn this episode into a short-form content series?',
    'What clip formats perform best on TikTok vs Reels?',
    'How many clips should I create per long-form video?',
    'What makes a viral clip in my niche?',
  ],
  'words_transcribed': [
    'How can I repurpose my transcripts into blog posts?',
    'What\'s the best way to improve transcription accuracy?',
    'Can I use my transcripts for SEO optimization?',
    'How do I create show notes from my transcripts?',
  ],
  'captions_synced': [
    'What caption styles perform best for engagement?',
    'How do I add animated word-by-word captions?',
    'Should I use different caption styles per platform?',
    'How do captions affect my video performance?',
  ],
  'fillers_removed': [
    'How can I speak with fewer filler words naturally?',
    'What\'s an acceptable filler word rate for podcasts?',
    'Does removing all fillers sound too robotic?',
    'How do I balance natural speech with clean audio?',
  ],
  'audio_enhanced': [
    'What audio settings work best for my niche?',
    'How do I achieve studio-quality sound at home?',
    'Should I add background music to my content?',
    'What\'s the ideal audio level for podcasts?',
  ],
};

async function queryInsightCorpus(
  supabase: any,
  metricKey: string,
  creatorType: string,
  limit: number = 5
) {
  const applicableMetrics = METRIC_KEY_MAP[metricKey] || [metricKey];
  
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

  if (creatorType && documents) {
    return documents.filter((doc: any) => 
      doc.creator_type_tags?.includes(creatorType) || 
      doc.creator_type_tags?.length === 0 ||
      !doc.creator_type_tags
    );
  }

  return documents || [];
}

function calculateTrend(currentValue: number, previousValue: number): { trend: 'up' | 'down' | 'flat'; trendPercent: number | null } {
  if (previousValue === 0) {
    return { trend: currentValue > 0 ? 'up' : 'flat', trendPercent: null };
  }
  const percent = ((currentValue - previousValue) / previousValue) * 100;
  if (Math.abs(percent) < 5) {
    return { trend: 'flat', trendPercent: percent };
  }
  return { trend: percent > 0 ? 'up' : 'down', trendPercent: Math.round(percent * 10) / 10 };
}

function buildWhereYouStand(
  metricKey: string,
  userValue: number,
  documents: any[]
): WhereYouStand {
  const config = METRIC_CONFIG[metricKey] || { unit: '', benchmarkValue: 0, benchmarkLabel: 'Industry average' };
  
  // Calculate trend (simulated - in production, compare to previous period)
  const previousValue = userValue * 0.8; // Simulated previous value
  const { trend, trendPercent } = calculateTrend(userValue, previousValue);
  
  // Build user stats
  const userStats: UserStats = {
    value: userValue,
    unit: config.unit,
    period: 'last_7_days',
    trend,
    trendPercent,
  };

  // Build benchmarks from documents and config
  const benchmarks: Benchmark[] = [];
  const docBenchmarks = documents.flatMap((doc: any) => doc.benchmarks || []);
  
  if (docBenchmarks.length > 0) {
    const relevant = docBenchmarks[0];
    benchmarks.push({
      label: relevant.label || config.benchmarkLabel,
      value: relevant.value || config.benchmarkValue,
      unit: relevant.unit || config.unit,
      direction: userValue >= (relevant.value || config.benchmarkValue) ? 'informational' : 'target_above',
    });
  } else {
    benchmarks.push({
      label: config.benchmarkLabel,
      value: config.benchmarkValue,
      unit: config.unit,
      direction: userValue >= config.benchmarkValue ? 'informational' : 'target_above',
    });
  }

  // Build takeaways
  const takeaways: string[] = [];
  const comparison = userValue >= config.benchmarkValue;
  
  if (comparison) {
    takeaways.push(`You're performing above average for creators in your segment.`);
    takeaways.push(`Keep this momentum—consistency is key to sustained growth.`);
  } else {
    takeaways.push(`You're saving more time than last week, but still below heavy AI users in your segment.`);
    takeaways.push(`Most growth-focused creators achieve ${config.benchmarkValue}+ ${config.unit}/week with automated cleanup and clipping.`);
  }

  return { userStats, benchmarks, takeaways };
}

function buildIndustryPractices(documents: any[], metricKey: string): IndustryPractices {
  const items: IndustryPracticeItem[] = [];
  
  for (const doc of documents.slice(0, 3)) {
    const keyPoints = doc.key_points || [];
    const recommendedActions = doc.recommended_actions || [];
    
    for (const point of keyPoints.slice(0, 1)) {
      const text = typeof point === 'string' ? point : point.text || point.point || '';
      if (text) {
        items.push({
          title: text.split('.')[0].slice(0, 50) + (text.length > 50 ? '...' : ''),
          description: text,
          sourceHints: [`${doc.source_id ? 'rss' : 'firecrawl'}:${doc.id}`],
        });
      }
    }
    
    for (const action of recommendedActions.slice(0, 1)) {
      const text = typeof action === 'string' ? action : action.text || action.action || '';
      if (text) {
        items.push({
          title: 'Recommended Practice',
          description: `Creators like you are seeing results when they ${text}`,
          sourceHints: [`${doc.source_id ? 'rss' : 'firecrawl'}:${doc.id}`],
        });
      }
    }
  }

  // Fallback items if no documents
  if (items.length === 0) {
    items.push(
      { 
        title: 'Batch-edit sessions', 
        description: 'High-performing podcasters dedicate one block per week to run AI cleanup on all recent episodes.',
        sourceHints: ['internal:best_practices'],
      },
      { 
        title: 'Systematic clip workflows', 
        description: 'Top shows generate 5–10 short clips per episode and publish across 2–3 platforms.',
        sourceHints: ['internal:short_form_best_practices'],
      },
    );
  }

  const summary = items.length > 0
    ? 'Creators who grow fastest use AI for repetitive cleanup and clip generation, not just transcription.'
    : 'Build consistent habits with AI-powered workflows to maximize your content output.';

  return { summary, items: items.slice(0, 5) };
}

function buildInProductCTAs(metricKey: string, projectId?: string): InProductCTA[] {
  const templates = CTA_TEMPLATES[metricKey] || CTA_TEMPLATES['time_saved'];
  
  return templates.map((cta, index) => ({
    ...cta,
    priority: index + 1,
    payload: { ...cta.payload, ...(projectId ? { projectId } : {}) },
  }));
}

function buildSuggestedQuestions(metricKey: string): string[] {
  return SUGGESTED_QUESTIONS[metricKey] || [
    `How can I improve my ${metricKey.replace(/_/g, ' ')}?`,
    'What are the best practices for creators in my niche?',
    'What experiment should I try this week?',
    'Help me create a weekly content plan.',
  ];
}

function buildSummary(metricKey: string, userValue: number, config: any): { headline: string; oneLiner: string } {
  const unit = config?.unit || '';
  const headlines: Record<string, string> = {
    'time_saved': `You saved ${userValue} ${unit} of editing time this week.`,
    'clips_created': `You created ${userValue} clips this week.`,
    'words_transcribed': `You transcribed ${userValue.toLocaleString()} words.`,
    'fillers_removed': `You removed ${userValue} filler words.`,
    'captions_synced': `You synced ${userValue} ${unit} of captions.`,
    'audio_enhanced': `${userValue}% of your audio is enhanced.`,
  };

  const oneLiners: Record<string, string> = {
    'time_saved': `You're using Refiner AI regularly, but there's still room to automate more.`,
    'clips_created': `Great progress! Consider testing different formats for maximum reach.`,
    'words_transcribed': `Your content library is growing—repurpose for more impact.`,
    'fillers_removed': `Your audio is cleaner than average. Keep refining for polish.`,
    'captions_synced': `Accessibility boosts engagement—keep adding captions.`,
    'audio_enhanced': `Quality audio = higher retention. Nice work!`,
  };

  return {
    headline: headlines[metricKey] || `Your ${metricKey.replace(/_/g, ' ')}: ${userValue}`,
    oneLiner: oneLiners[metricKey] || 'Keep building momentum with consistent AI-assisted workflows.',
  };
}

async function generateAIEnhancedResponse(
  baseResponse: InsightResponse,
  documents: any[],
  apiKey: string
): Promise<InsightResponse> {
  const prompt = `You are Refiner AI, a smart content optimization assistant for creators.

Enhance these insights to be more specific and actionable. Keep the same JSON structure.

Current response:
${JSON.stringify(baseResponse, null, 2)}

Industry documents context:
${documents.slice(0, 3).map(d => `- ${d.title}: ${d.content_summary || ''}`).join('\n')}

Rules:
1. Keep response structure EXACTLY the same
2. Make copy short, punchy, and motivational
3. Tie statements to actions the user can take in Alchify
4. Never fabricate specific statistics - use directional language like "many shows", "top creators"
5. Return ONLY valid JSON

Return the enhanced response JSON:`;

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
          { role: "system", content: "You are a JSON-only response bot. Return only valid JSON matching the exact input structure." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        return {
          ...baseResponse,
          summary: enhanced.summary || baseResponse.summary,
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
    const requestBody = await req.json();
    
    // Support both old format and new format
    const isNewFormat = 'userId' in requestBody && !('action' in requestBody);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // ========== NEW FORMAT: insightsEngine.generateInsights(request) ==========
    if (isNewFormat) {
      const request: InsightRequest = requestBody;
      const { userId, metricKey, timeRange, context } = request;
      
      console.log('Insight Engine V2 request:', { userId, metricKey, context });
      
      const creatorType = context?.creatorType || 'creator';
      const projectId = context?.projectId;
      
      // Query the insight corpus
      const documents = await queryInsightCorpus(supabase, metricKey, creatorType);
      console.log(`Found ${documents.length} relevant documents for ${metricKey}`);
      
      // Get user metrics (in production, query from user_usage table based on timeRange)
      // For now, simulate with placeholder values
      let userValue = 4.2; // Default
      
      // Try to get actual user metrics
      if (userId) {
        const { data: usageData } = await supabase
          .from('user_usage')
          .select('*')
          .eq('user_id', userId)
          .order('month_year', { ascending: false })
          .limit(1)
          .single();
        
        if (usageData) {
          const metricMap: Record<string, number> = {
            'time_saved': Number(usageData.recording_hours_used) * 0.75 || 0,
            'words_transcribed': Number(usageData.podcasts_count) * 5000 || 0,
            'storage_used': Number(usageData.storage_used_gb) || 0,
          };
          userValue = metricMap[metricKey] || userValue;
        }
      }

      const config = METRIC_CONFIG[metricKey];
      
      // Build the structured response
      let response: InsightResponse = {
        metricKey,
        summary: buildSummary(metricKey, userValue, config),
        whereYouStand: buildWhereYouStand(metricKey, userValue, documents),
        industryPractices: buildIndustryPractices(documents, metricKey),
        inProductCTAs: buildInProductCTAs(metricKey, projectId),
        suggestedQuestions: buildSuggestedQuestions(metricKey),
        debug: {
          documentsUsed: documents.map((d: any, i: number) => ({
            id: d.id,
            source: d.source_id ? 'rss' : 'firecrawl',
            weight: 1 - (i * 0.1),
          })),
        },
      };

      // Enhance with AI if available
      if (LOVABLE_API_KEY && documents.length > 0) {
        response = await generateAIEnhancedResponse(response, documents, LOVABLE_API_KEY);
      }

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // ========== OLD FORMAT: action-based requests ==========
    const { action, userId, metricKey, userMetrics, creatorType = 'creator' } = requestBody;
    
    console.log('Insight Engine legacy request:', { action, metricKey, creatorType });

    if (action === 'getMetricInsight') {
      const documents = await queryInsightCorpus(supabase, metricKey, creatorType);
      console.log(`Found ${documents.length} relevant documents for ${metricKey}`);

      const metricKeyNormalized = metricKey.toLowerCase().replace(/\s+/g, '_');
      const userValue = userMetrics?.[metricKeyNormalized] || userMetrics?.[metricKey] || 0;
      const config = METRIC_CONFIG[metricKeyNormalized];

      let response: InsightResponse = {
        metricKey: metricKeyNormalized,
        summary: buildSummary(metricKeyNormalized, userValue, config),
        whereYouStand: buildWhereYouStand(metricKeyNormalized, userValue, documents),
        industryPractices: buildIndustryPractices(documents, metricKeyNormalized),
        inProductCTAs: buildInProductCTAs(metricKeyNormalized),
        suggestedQuestions: buildSuggestedQuestions(metricKeyNormalized),
      };

      if (LOVABLE_API_KEY && documents.length > 0) {
        response = await generateAIEnhancedResponse(response, documents, LOVABLE_API_KEY);
      }

      return new Response(
        JSON.stringify({ success: true, data: response }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'getInsights') {
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
