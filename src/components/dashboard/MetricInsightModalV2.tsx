import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight, 
  Target,
  BarChart3,
  Zap,
  MessageCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRefinerAI } from '@/hooks/useRefinerAI';

interface StructuredInsight {
  whereYouStand: { text: string; benchmark?: string }[];
  industryPractices: { text: string; source?: string }[];
  inProductCTAs: { label: string; action: string; payload?: any }[];
  suggestedQuestions: string[];
}

interface MetricInsightModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  metricKey: string;
  metricValue: string;
  metricIcon?: React.ReactNode;
  userMetrics: Record<string, any>;
  creatorType?: 'creator' | 'podcaster' | 'agency';
}

export function MetricInsightModalV2({ 
  isOpen, 
  onClose, 
  metricKey,
  metricValue,
  metricIcon, 
  userMetrics,
  creatorType = 'creator'
}: MetricInsightModalV2Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openWithPrompt } = useRefinerAI();
  const [insight, setInsight] = useState<StructuredInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch insights when modal opens
  const fetchInsights = async () => {
    if (insight) return; // Already loaded
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('insight-engine-v2', {
        body: {
          action: 'getMetricInsight',
          metricKey,
          userMetrics,
          creatorType,
        }
      });

      if (fnError) throw fnError;
      
      if (data?.success) {
        setInsight(data.data);
      } else {
        throw new Error(data?.error || 'Failed to load insights');
      }
    } catch (err) {
      console.error('Error fetching metric insight:', err);
      setError('Failed to load insights. Using fallback data.');
      // Set fallback data
      setInsight({
        whereYouStand: [
          { text: `Your current ${metricKey.toLowerCase()}: ${metricValue}` },
          { text: 'You\'re making progress! Keep building momentum.' },
        ],
        industryPractices: [
          { text: 'Top creators focus on consistency over perfection.' },
          { text: 'Repurposing content is the #1 growth strategy.' },
        ],
        inProductCTAs: [
          { label: 'Upload New Content', action: 'NAVIGATE:/upload' },
          { label: 'View Projects', action: 'NAVIGATE:/projects' },
        ],
        suggestedQuestions: [
          `How can I improve my ${metricKey.toLowerCase()}?`,
          'What should I focus on this week?',
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when modal opens
  if (isOpen && !insight && !isLoading && !error) {
    fetchInsights();
  }

  const handleCTAClick = (action: string) => {
    if (action.startsWith('NAVIGATE:')) {
      const path = action.replace('NAVIGATE:', '');
      onClose();
      navigate(path);
    } else if (action.startsWith('OPEN_')) {
      // Handle special actions
      toast({
        title: 'Coming soon',
        description: `The ${action.replace('OPEN_', '').replace(/_/g, ' ').toLowerCase()} feature is coming soon!`,
      });
    }
  };

  const handleQuestionClick = (question: string) => {
    onClose();
    // Open the Refiner AI panel with the question
    openWithPrompt(question);
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
            <div>
              <Badge variant="secondary" className="mb-1">{metricKey}</Badge>
              <DialogTitle className="text-3xl font-bold text-foreground">
                {metricValue}
              </DialogTitle>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : insight ? (
              <>
                {/* Section 1: Where You Stand */}
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Where You Stand</h3>
                  </div>
                  <ul className="space-y-2">
                    {insight.whereYouStand.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 2: What the Industry is Doing */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-accent" />
                    <h3 className="font-semibold text-foreground">What the Industry is Doing</h3>
                  </div>
                  <ul className="space-y-2">
                    {insight.industryPractices.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <ChevronRight className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm text-muted-foreground">{item.text}</span>
                          {item.source && (
                            <span className="text-xs text-muted-foreground/60 ml-1">
                              — {item.source}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Section 3: In-Product CTAs */}
                <div className="bg-muted/30 border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-green-500" />
                    <h3 className="font-semibold text-foreground">Do This Next in Alchify</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {insight.inProductCTAs.map((cta, i) => (
                      <Button
                        key={i}
                        variant={i === 0 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleCTAClick(cta.action)}
                        className={i === 0 ? 'bg-gradient-to-r from-primary to-accent' : ''}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        {cta.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Section 4: Suggested Questions */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-foreground">Explore with Refiner AI</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insight.suggestedQuestions.map((question, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuestionClick(question)}
                        className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full px-3 py-1.5 hover:bg-purple-500/20 transition-colors text-left"
                      >
                        {question}
                      </button>
                    ))}
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
