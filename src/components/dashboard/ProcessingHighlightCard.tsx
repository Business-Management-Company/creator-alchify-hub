import { useState } from 'react';
import { Insight } from '@/hooks/useCreatorInsights';
import { MetricInsightModal } from './MetricInsightModal';

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

  return (
    <>
      <div 
        onClick={() => insight && setIsModalOpen(true)}
        className={`
          bg-gradient-to-br ${colorClass} rounded-lg p-3 text-center
          transition-all duration-200
          ${insight ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
        `}
      >
        <div className="text-xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {passiveInsight && (
          <div className="text-[9px] text-muted-foreground/60 mt-1 italic leading-tight">
            {passiveInsight.slice(0, 50)}...
          </div>
        )}
      </div>

      <MetricInsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        insight={insight || null}
      />
    </>
  );
}
