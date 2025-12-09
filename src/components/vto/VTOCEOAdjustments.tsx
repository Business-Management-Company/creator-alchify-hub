import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SlidersHorizontal } from 'lucide-react';
import { CEOAdjustments } from '@/types/vto';

interface VTOCEOAdjustmentsProps {
  adjustments: CEOAdjustments;
  onChange: (adjustments: CEOAdjustments) => void;
}

export const VTOCEOAdjustments = ({ adjustments, onChange }: VTOCEOAdjustmentsProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <CardTitle>CEO Adjustment Controls</CardTitle>
        </div>
        <CardDescription>Calibrate your organization's focus and execution confidence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Vision Clarity</label>
              <span className="text-sm text-muted-foreground">{adjustments.visionClarity}/10</span>
            </div>
            <Slider
              value={[adjustments.visionClarity]}
              onValueChange={([v]) => onChange({ ...adjustments, visionClarity: v })}
              max={10}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Team Alignment</label>
              <span className="text-sm text-muted-foreground">{adjustments.teamAlignment}/10</span>
            </div>
            <Slider
              value={[adjustments.teamAlignment]}
              onValueChange={([v]) => onChange({ ...adjustments, teamAlignment: v })}
              max={10}
              step={1}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Execution Confidence</label>
              <span className="text-sm text-muted-foreground">{adjustments.executionConfidence}%</span>
            </div>
            <Slider
              value={[adjustments.executionConfidence]}
              onValueChange={([v]) => onChange({ ...adjustments, executionConfidence: v })}
              max={100}
              step={5}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Quarterly Focus Level</label>
              <span className="text-sm text-muted-foreground">{adjustments.quarterlyFocusLevel} Rocks</span>
            </div>
            <Slider
              value={[adjustments.quarterlyFocusLevel]}
              onValueChange={([v]) => onChange({ ...adjustments, quarterlyFocusLevel: v })}
              min={3}
              max={7}
              step={1}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Risk Level</label>
          <ToggleGroup 
            type="single" 
            value={adjustments.riskLevel}
            onValueChange={(v) => v && onChange({ ...adjustments, riskLevel: v as CEOAdjustments['riskLevel'] })}
            className="justify-start"
          >
            <ToggleGroupItem value="low" className="px-4">Low</ToggleGroupItem>
            <ToggleGroupItem value="medium" className="px-4">Medium</ToggleGroupItem>
            <ToggleGroupItem value="high" className="px-4">High</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  );
};
