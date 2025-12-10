import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Insight } from '@/hooks/useCreatorInsights';
import { InsightModal } from './InsightModal';
import { LABEL_TO_METRIC_KEY, MetricKey } from '@/types/insights';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ProcessingHighlightCardProps {
  label: string;
  value: string;
  colorClass: string;
  passiveInsight?: string;
  insight?: Insight;
}

export function ProcessingHighlightCard({ 
  label, 
  value, 
  colorClass, 
  passiveInsight,
  insight 
}: ProcessingHighlightCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get metric key from label
  const metricKey: MetricKey = LABEL_TO_METRIC_KEY[label] || 'time_saved_hours';
  
  // Parse numeric value from string (e.g., "47" or "2.4k")
  let numericValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
  if (value.includes('k')) numericValue *= 1000;

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`
          bg-gradient-to-br ${colorClass} rounded-lg p-3 text-center
          transition-all duration-200
          cursor-pointer hover:scale-105 hover:shadow-lg
          relative group
        `}
      >
        {/* AI Insight Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-1.5 right-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click for AI insights</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {passiveInsight && (
          <div className="text-[9px] text-muted-foreground/60 mt-1 italic leading-tight">
            {passiveInsight.slice(0, 50)}...
          </div>
        )}
      </div>

      <InsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        metricKey={metricKey}
        metricValue={numericValue}
        metricLabel={label}
      />
    </>
  );
}
