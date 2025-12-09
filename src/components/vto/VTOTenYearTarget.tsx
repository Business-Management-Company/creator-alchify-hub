import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target } from 'lucide-react';
import { VTOEditableField } from './VTOEditableField';
import { VTOAIButton } from './VTOAIButton';
import { TenYearTarget } from '@/types/vto';

interface VTOTenYearTargetProps {
  target: TenYearTarget;
  onChange: (target: TenYearTarget) => void;
}

export const VTOTenYearTarget = ({ target, onChange }: VTOTenYearTargetProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>10-Year Target™</CardTitle>
          </div>
          <VTOAIButton 
            label="Recommend a 10-Year Target" 
            onResult={() => {}}
            context={`Target: ${target.target}, Description: ${target.description}`}
            prompt="Recommend a 10-year target based on market data"
          />
        </div>
        <CardDescription>Your long-range, energizing goal that everyone is working toward</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center p-6 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">The Target</label>
            <VTOEditableField
              value={target.target}
              onChange={(value) => onChange({ ...target, target: value })}
              placeholder="$100M Revenue / 1M Users / Industry Leader"
              className="text-3xl font-bold text-center"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <div className="p-3 bg-muted/50 rounded-lg">
            <VTOEditableField
              value={target.description}
              onChange={(value) => onChange({ ...target, description: value })}
              multiline
              placeholder="What does achieving this target look like? Paint the picture."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
