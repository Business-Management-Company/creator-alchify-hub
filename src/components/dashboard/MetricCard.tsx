import { useState } from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { Insight } from '@/hooks/useCreatorInsights';
import { InsightModal } from './InsightModal';
import { LABEL_TO_METRIC_KEY, MetricKey } from '@/types/insights';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MetricCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  subtext: string;
  passiveInsight?: string;
  insight?: Insight;
}

export function MetricCard({ label, value, icon: Icon, subtext, passiveInsight, insight }: MetricCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get metric key from label
  const metricKey: MetricKey = LABEL_TO_METRIC_KEY[label] || 'time_saved_hours';
  
  // Parse numeric value from string (e.g., "4.2 hrs" -> 4.2)
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`
          bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm 
          hover:border-primary/30 transition-all duration-200
          cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5
          relative group
        `}
      >
        {/* AI Insight Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click for AI insights</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        
        {/* Passive Insight */}
        {passiveInsight && (
          <p className="text-[10px] text-muted-foreground/70 mt-2 italic leading-tight border-t border-border/50 pt-2">
            {passiveInsight}
          </p>
        )}
      </div>

      <InsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metricKey={metricKey}
        metricValue={numericValue}
        metricLabel={label}
        metricIcon={<Icon className="h-5 w-5 text-primary" />}
      />
    </>
  );
}
