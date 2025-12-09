import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Flag, Plus, Trash2 } from 'lucide-react';
import { VTOEditableField } from './VTOEditableField';
import { VTOAIButton } from './VTOAIButton';
import { OneYearPlan } from '@/types/vto';

interface VTOOneYearPlanProps {
  plan: OneYearPlan;
  onChange: (plan: OneYearPlan) => void;
}

export const VTOOneYearPlan = ({ plan, onChange }: VTOOneYearPlanProps) => {
  const addPriority = () => {
    onChange({ ...plan, priorities: [...plan.priorities, ''] });
  };

  const updatePriority = (index: number, value: string) => {
    const newPriorities = [...plan.priorities];
    newPriorities[index] = value;
    onChange({ ...plan, priorities: newPriorities });
  };

  const removePriority = (index: number) => {
    onChange({ ...plan, priorities: plan.priorities.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" />
            <CardTitle>1-Year Plan</CardTitle>
          </div>
          <VTOAIButton 
            label="Generate 1-Year Plan From Vision" 
            onResult={() => {}}
            context={JSON.stringify(plan)}
            prompt="Generate a 1-year plan based on the vision"
          />
        </div>
        <CardDescription>Your goals and priorities for the next 12 months</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <label className="text-sm font-medium text-muted-foreground">Revenue Target</label>
            <VTOEditableField
              value={plan.revenueTarget}
              onChange={(value) => onChange({ ...plan, revenueTarget: value })}
              placeholder="$1.2M"
              className="text-2xl font-bold text-center"
            />
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <label className="text-sm font-medium text-muted-foreground">Profit Target</label>
            <VTOEditableField
              value={plan.profitTarget}
              onChange={(value) => onChange({ ...plan, profitTarget: value })}
              placeholder="$200K"
              className="text-2xl font-bold text-center"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Annual Priorities (5-7)</label>
          <div className="space-y-2">
            {plan.priorities.map((priority, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-4">{index + 1}.</span>
                <Input
                  value={priority}
                  onChange={(e) => updatePriority(index, e.target.value)}
                  placeholder="Enter priority..."
                  className="flex-1"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removePriority(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {plan.priorities.length < 7 && (
              <Button variant="outline" onClick={addPriority} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Priority
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
