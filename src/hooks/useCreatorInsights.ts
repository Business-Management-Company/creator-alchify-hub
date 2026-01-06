import { useState, useEffect, useCallback } from 'react';
import { apiPost } from '@/lib/api';

export interface Insight {
  metric: string;
  creatorValue: string;
  industryContext: string;
  insight: string;
  recommendedAction: string;
  cta: string;
  ctaAction: string;
  passiveInsight: string;
}

export interface CreatorMetrics {
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

interface UseCreatorInsightsReturn {
  insights: Insight[];
  insightOfTheDay: Insight | null;
  isLoading: boolean;
  error: string | null;
  getInsightForMetric: (metricName: string) => Insight | undefined;
  generateDeepDive: () => Promise<string | null>;
  isGeneratingDeepDive: boolean;
  refreshInsights: () => Promise<void>;
}

export function useCreatorInsights(metrics: CreatorMetrics): UseCreatorInsightsReturn {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightOfTheDay, setInsightOfTheDay] = useState<Insight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingDeepDive, setIsGeneratingDeepDive] = useState(false);

  const fetchInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await apiPost<{ success?: boolean; insights?: Insight[]; insightOfTheDay?: Insight; error?: string }>('/insight-engine', {
        action: 'getInsights', metrics
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setInsights(data.insights);
        setInsightOfTheDay(data.insightOfTheDay);
      } else {
        throw new Error(data?.error || 'Failed to fetch insights');
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      
      // Fallback to local insights generation
      setInsights(generateLocalInsights(metrics));
    } finally {
      setIsLoading(false);
    }
  }, [metrics]);

  useEffect(() => {
    // Only fetch if we have meaningful data
    if (metrics.projectCount > 0 || metrics.timeSavedHours > 0) {
      fetchInsights();
    } else {
      setIsLoading(false);
      setInsights(generateLocalInsights(metrics));
      setInsightOfTheDay(generateLocalInsights(metrics)[0]);
    }
  }, [metrics.projectCount, metrics.timeSavedHours]);

  const getInsightForMetric = useCallback((metricName: string): Insight | undefined => {
    return insights.find(i => i.metric === metricName);
  }, [insights]);

  const generateDeepDive = useCallback(async (): Promise<string | null> => {
    setIsGeneratingDeepDive(true);
    
    try {
      const { data, error: fnError } = await apiPost<{ success?: boolean; report?: string; error?: string }>('/insight-engine', {
        action: 'generateDeepDive', metrics
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        return data.report;
      } else {
        throw new Error(data?.error || 'Failed to generate report');
      }
    } catch (err) {
      console.error('Error generating deep dive:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
      return null;
    } finally {
      setIsGeneratingDeepDive(false);
    }
  }, [metrics]);

  const refreshInsights = useCallback(async () => {
    await fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    insightOfTheDay,
    isLoading,
    error,
    getInsightForMetric,
    generateDeepDive,
    isGeneratingDeepDive,
    refreshInsights,
  };
}

// Local fallback insights when API is unavailable
function generateLocalInsights(metrics: CreatorMetrics): Insight[] {
  return [
    {
      metric: "Time Saved",
      creatorValue: `${metrics.timeSavedHours.toFixed(1)} hrs`,
      industryContext: "Top creators save 4+ hours weekly on editing",
      insight: "Creators saving 4+ hours/week typically publish 3× more content.",
      recommendedAction: "Upload more long-form content to maximize time savings.",
      cta: "Upload New Content",
      ctaAction: "/upload",
      passiveInsight: "Creators saving 4+ hours/week typically publish 3× more content.",
    },
    {
      metric: "Fillers Removed",
      creatorValue: metrics.fillersRemoved.toString(),
      industryContext: "Professional podcasters remove 50+ filler words per episode",
      insight: "Your filler removal efficiency is improving. Keep it up!",
      recommendedAction: "Record a new session and let AI clean it up.",
      cta: "Record Now",
      ctaAction: "/studio",
      passiveInsight: "Your filler removal efficiency is in the top 20% of Alchify creators.",
    },
    {
      metric: "Pauses Cut",
      creatorValue: metrics.pausesCut.toString(),
      industryContext: "Engaging videos typically have 15+ strategic pause removals",
      insight: "Strategic pause removal keeps your audience engaged.",
      recommendedAction: "Process your next podcast through the Refiner.",
      cta: "Optimize Audio",
      ctaAction: "/upload",
      passiveInsight: "Podcast creators who remove 50% of pauses see 22% higher retention.",
    },
    {
      metric: "Clips Created",
      creatorValue: metrics.clipsCreated.toString(),
      industryContext: "Viral creators produce 10+ clips per long-form video",
      insight: "More clips = more reach. Consider generating 10+ clips per video.",
      recommendedAction: "Generate more clips from your existing projects.",
      cta: "Generate Clips",
      ctaAction: "/projects",
      passiveInsight: "Top creators generate 10+ clips per long-form video for 5× more reach.",
    },
    {
      metric: "Audio Enhanced",
      creatorValue: `${metrics.audioEnhancedPercent}%`,
      industryContext: "Studio-quality podcasts achieve 25%+ audio enhancement",
      insight: "Studio-quality audio increases listener trust by 35%.",
      recommendedAction: "Upload raw audio for AI-powered enhancement.",
      cta: "Enhance Audio",
      ctaAction: "/upload",
      passiveInsight: "Studio-quality audio increases listener trust by 35%.",
    },
    {
      metric: "Words Transcribed",
      creatorValue: metrics.wordsTranscribed >= 1000 ? `${(metrics.wordsTranscribed / 1000).toFixed(1)}k` : metrics.wordsTranscribed.toString(),
      industryContext: "Active creators transcribe 5,000+ words weekly",
      insight: "Creators with 5k+ weekly words grow 2× faster.",
      recommendedAction: "Upload more content to build your library.",
      cta: "Upload Content",
      ctaAction: "/upload",
      passiveInsight: "Creators with 5k+ weekly transcribed words grow 2× faster.",
    },
    {
      metric: "Captions Synced",
      creatorValue: metrics.captionsSynced.toString(),
      industryContext: "Accessibility-focused creators sync 20+ caption segments",
      insight: "Captioned videos get 40% more views and improved SEO.",
      recommendedAction: "Enable auto-captions on your next export.",
      cta: "Add Captions",
      ctaAction: "/projects",
      passiveInsight: "Captioned videos get 40% more views and improved SEO.",
    },
    {
      metric: "Projects",
      creatorValue: metrics.projectCount.toString(),
      industryContext: "Consistent creators manage 10+ active projects",
      insight: "Creators with 6+ projects repurpose 4× more clips.",
      recommendedAction: "Create a new project from your latest recording.",
      cta: "New Project",
      ctaAction: "/upload",
      passiveInsight: "Creators with 6+ projects tend to repurpose 4× more clips.",
    },
    {
      metric: "Exports",
      creatorValue: metrics.exportsCount.toString(),
      industryContext: "Multi-platform creators export 25+ variants monthly",
      insight: "Multi-platform creators with 25+ exports see 3× engagement.",
      recommendedAction: "Export your best clips in multiple formats.",
      cta: "Export Clips",
      ctaAction: "/projects",
      passiveInsight: "Multi-platform creators with 25+ monthly exports see 3× engagement.",
    },
    {
      metric: "Avg Accuracy",
      creatorValue: `${metrics.avgAccuracy}%`,
      industryContext: "Professional transcriptions achieve 98%+ accuracy",
      insight: "98%+ accuracy reduces manual editing time by 50%.",
      recommendedAction: "Upload higher-quality audio for better accuracy.",
      cta: "Improve Quality",
      ctaAction: "/upload",
      passiveInsight: "98%+ accuracy reduces manual editing time by 50%.",
    },
  ];
}
