import { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import { Insight } from '@/hooks/useCreatorInsights';
import { MetricInsightModal } from './MetricInsightModal';

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

  return (
    <>
      <div 
        onClick={() => insight && setIsModalOpen(true)}
        className={`
          bg-card/50 border border-border rounded-xl p-4 backdrop-blur-sm 
          hover:border-primary/30 transition-all duration-200
          ${insight ? 'cursor-pointer hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5' : ''}
        `}
      >
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

      <MetricInsightModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        insight={insight || null}
        metricIcon={<Icon className="h-5 w-5 text-primary" />}
      />
    </>
  );
}
