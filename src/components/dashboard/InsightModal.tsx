import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Lightbulb, 
  Target,
  Zap,
  MessageCircle,
  ChevronRight,
  Sparkles,
  BarChart3,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InsightResponse, InsightRequest, MetricKey } from '@/types/insights';

interface InsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricKey: MetricKey;
  metricValue: number;
  metricLabel: string;
  metricIcon?: React.ReactNode;
  userId?: string;
}

export function InsightModal({ 
  isOpen, 
  onClose, 
  metricKey,
  metricValue,
  metricLabel,
  metricIcon,
  userId
}: InsightModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [insight, setInsight] = useState<InsightResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch insights when modal opens
  useEffect(() => {
    if (isOpen && !insight && !isLoading) {
      fetchInsights();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInsight(null);
      setError(null);
    }
  }, [isOpen]);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const request: InsightRequest = {
        metricKey,
        metricValue,
        userContext: {
          userId: userId || 'anonymous',
          plan: 'pro',
          contentType: 'mixed',
        }
      };

      const { data, error: fnError } = await supabase.functions.invoke('insight-engine-v2', {
        body: {
          action: 'generateInsight',
          request
        }
      });

      if (fnError) throw fnError;
      
      if (data?.success && data?.data) {
        setInsight(data.data);
      } else {
        throw new Error(data?.error || 'Failed to load insights');
      }
    } catch (err) {
      console.error('Error fetching metric insight:', err);
      setError('Failed to load insights. Using fallback data.');
      // Set fallback data
      setInsight(generateFallbackInsight(metricKey, metricValue, metricLabel));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCTAClick = (action: string) => {
    if (action.startsWith('NAVIGATE:')) {
      const path = action.replace('NAVIGATE:', '');
      onClose();
      navigate(path);
    } else if (action.startsWith('OPEN_')) {
      toast({
        title: 'Coming soon',
        description: `The ${action.replace('OPEN_', '').replace(/_/g, ' ').toLowerCase()} feature is coming soon!`,
      });
    }
  };

  const handleQuestionClick = (question: string) => {
    onClose();
    toast({
      title: 'Ask Refiner AI',
      description: question,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20">
              {metricIcon || <BarChart3 className="h-6 w-6 text-primary" />}
            </div>
            <div className="flex-1">
              <Badge variant="secondary" className="mb-1 capitalize">
                {metricLabel}
              </Badge>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {insight?.title || `Your ${metricLabel}`}
              </DialogTitle>
            </div>
            <Sparkles className="h-5 w-5 text-primary/50" />
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-5">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : insight ? (
              <>
                {/* Summary */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {insight.summary}
                  </p>
                </div>

                {/* Key Takeaways */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Key Takeaways</h3>
                  </div>
                  <ul className="space-y-2">
                    {insight.insightBullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommended Next Steps */}
                <div className="bg-muted/30 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">Recommended Next Steps</h3>
                  </div>
                  <ul className="space-y-2 mb-4">
                    {insight.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Zap className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{rec}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-primary to-accent"
                      onClick={() => handleCTAClick('NAVIGATE:/upload')}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Upload New Content
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCTAClick('NAVIGATE:/projects')}
                    >
                      View Projects
                    </Button>
                  </div>
                </div>

                {/* Industry Context */}
                {(insight.industryContext || insight.sourceSnippets?.length) && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-5 w-5 text-accent" />
                      <h3 className="font-semibold text-foreground">What the Industry is Doing</h3>
                    </div>
                    {insight.industryContext && (
                      <p className="text-sm text-muted-foreground mb-3">{insight.industryContext}</p>
                    )}
                    {insight.sourceSnippets && insight.sourceSnippets.length > 0 && (
                      <div className="space-y-2">
                        {insight.sourceSnippets.map((snippet, i) => (
                          <div key={i} className="flex items-start gap-2 bg-muted/30 rounded-lg p-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">{snippet.label}</p>
                              <p className="text-xs text-muted-foreground/80 italic">"{snippet.snippet}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Focus Areas */}
                {insight.focusAreas && insight.focusAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {insight.focusAreas.map((area, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Explore with Refiner AI */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-foreground">Explore with Refiner AI</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleQuestionClick(`How can I improve my ${metricLabel.toLowerCase()}?`)}
                      className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 hover:bg-purple-500/20 transition-colors text-left"
                    >
                      How can I improve my {metricLabel.toLowerCase()}?
                    </button>
                    <button
                      onClick={() => handleQuestionClick('What should I focus on this week?')}
                      className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 hover:bg-purple-500/20 transition-colors text-left"
                    >
                      What should I focus on this week?
                    </button>
                    <button
                      onClick={() => handleQuestionClick('Help me create a content plan')}
                      className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 hover:bg-purple-500/20 transition-colors text-left"
                    >
                      Help me create a content plan
                    </button>
                  </div>
                </div>
              </>
            ) : error ? (
              <div className="text-center py-8 text-muted-foreground">
                {error}
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Fallback insight generator
function generateFallbackInsight(metricKey: MetricKey, metricValue: number, metricLabel: string): InsightResponse {
  const fallbacks: Record<string, InsightResponse> = {
    time_saved_hours: {
      metricKey: 'time_saved_hours',
      title: `You saved ${metricValue.toFixed(1)} hours this week`,
      summary: `You're using Refiner AI regularly to streamline your editing workflow. Creators who save 4+ hours per week typically publish 3× more content.`,
      insightBullets: [
        `Your time saved: ${metricValue.toFixed(1)} hours`,
        'Top creators in your category save 5-7 hours weekly',
        'Most time is saved through automated cleanup and clip generation',
      ],
      recommendations: [
        'Process your last 3 uploads in batch to save more time',
        'Generate 5+ clips per long-form video for maximum reach',
        'Enable auto-enhancement for new uploads',
      ],
      industryContext: 'High-performing creators dedicate one block per week to batch-process content with AI tools.',
      focusAreas: ['efficiency', 'batch-processing', 'automation'],
    },
    clips_created: {
      metricKey: 'clips_created',
      title: `You created ${metricValue} clips`,
      summary: `Clip creation is key to expanding your reach. Top shows generate 5-10 clips per episode across multiple platforms.`,
      insightBullets: [
        `Your clips created: ${metricValue}`,
        'Top creators average 10+ clips per long-form video',
        'Multi-platform distribution increases engagement by 3×',
      ],
      recommendations: [
        'Try different aspect ratios (9:16, 1:1, 16:9)',
        'Add animated captions for 40% more engagement',
        'A/B test clip styles to find your best performers',
      ],
      industryContext: 'Viral creators systematically test clip formats and optimize based on platform analytics.',
      focusAreas: ['clip-generation', 'multi-platform', 'engagement'],
    },
  };

  return fallbacks[metricKey] || {
    metricKey,
    title: `Your ${metricLabel}: ${metricValue}`,
    summary: `You're making progress! Keep building momentum with consistent AI-assisted workflows.`,
    insightBullets: [
      `Current value: ${metricValue}`,
      'Focus on consistency for best results',
      'Use AI tools to maximize your output',
    ],
    recommendations: [
      'Upload new content to continue growing',
      'Explore different tools in the Refiner',
      'Set weekly goals for this metric',
    ],
    industryContext: 'Successful creators focus on consistent, quality output supported by AI automation.',
    focusAreas: ['consistency', 'growth'],
  };
}
