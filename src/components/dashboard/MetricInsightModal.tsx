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
import { 
  Sparkles, 
  TrendingUp, 
  Lightbulb, 
  ArrowRight, 
  Target,
  BarChart3,
  Zap,
  ExternalLink
} from 'lucide-react';
import { Insight } from '@/hooks/useCreatorInsights';

interface MetricInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: Insight | null;
  metricIcon?: React.ReactNode;
}

export function MetricInsightModal({ isOpen, onClose, insight, metricIcon }: MetricInsightModalProps) {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(true);

  if (!insight) return null;

  const handleCTAClick = (action: string) => {
    onClose();
    navigate(action);
  };

  const secondaryCTAs = [
    { label: "See Industry Benchmarks", icon: BarChart3, action: "/analytics" },
    { label: "Analyze My Last Upload", icon: Zap, action: "/projects" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              {metricIcon || <BarChart3 className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">
                {insight.metric}
              </Badge>
              <DialogTitle className="text-2xl font-bold text-foreground">
                {insight.creatorValue}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Insight Summary */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">AI Insight</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.insight}
                </p>
              </div>
            </div>
          </div>

          {/* Industry Context */}
          <div className="bg-muted/30 border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-accent/10 shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Industry Context</h4>
                <p className="text-sm text-muted-foreground">
                  {insight.industryContext}
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-lg bg-green-500/10 shrink-0 mt-0.5">
                <Lightbulb className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Recommended Action</h4>
                <p className="text-sm text-muted-foreground">
                  {insight.recommendedAction}
                </p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <Button
            onClick={() => handleCTAClick(insight.ctaAction)}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl group"
            size="lg"
          >
            <Target className="mr-2 h-4 w-4" />
            {insight.cta}
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>

          {/* Secondary CTAs */}
          <div className="grid grid-cols-2 gap-2">
            {secondaryCTAs.map((cta) => (
              <Button
                key={cta.label}
                variant="outline"
                size="sm"
                onClick={() => handleCTAClick(cta.action)}
                className="text-xs"
              >
                <cta.icon className="mr-1.5 h-3.5 w-3.5" />
                {cta.label}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
