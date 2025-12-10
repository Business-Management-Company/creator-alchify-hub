import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Insight } from '@/hooks/useCreatorInsights';

interface InsightOfTheDayProps {
  insight: Insight | null;
  isLoading?: boolean;
}

export function InsightOfTheDay({ insight, isLoading }: InsightOfTheDayProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-2xl p-5 mb-6 animate-pulse">
        <div className="h-5 bg-primary/20 rounded w-1/3 mb-3" />
        <div className="h-4 bg-primary/10 rounded w-2/3" />
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 hover:border-primary/40 rounded-2xl p-5 mb-6 transition-all duration-300 group">
      {/* Animated glow effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 group-hover:bg-primary/30 transition-colors duration-500" />
      
      <div className="relative z-10 flex items-start gap-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 shrink-0">
          <Lightbulb className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Insight of the Day</span>
          </div>
          <p className="text-foreground font-medium mb-3 leading-relaxed">
            {insight.passiveInsight}
          </p>
          <Button
            onClick={() => navigate(insight.ctaAction)}
            variant="default"
            size="sm"
            className="bg-primary/90 hover:bg-primary text-primary-foreground group/btn"
          >
            {insight.cta}
            <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
