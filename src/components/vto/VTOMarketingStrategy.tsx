import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { VTOEditableField } from './VTOEditableField';
import { VTOAIButton } from './VTOAIButton';
import { MarketingStrategy } from '@/types/vto';

interface VTOMarketingStrategyProps {
  strategy: MarketingStrategy;
  onChange: (strategy: MarketingStrategy) => void;
}

export const VTOMarketingStrategy = ({ strategy, onChange }: VTOMarketingStrategyProps) => {
  const addUnique = () => {
    onChange({ ...strategy, threeUniques: [...strategy.threeUniques, ''] });
  };

  const updateUnique = (index: number, value: string) => {
    const newUniques = [...strategy.threeUniques];
    newUniques[index] = value;
    onChange({ ...strategy, threeUniques: newUniques });
  };

  const removeUnique = (index: number) => {
    onChange({ ...strategy, threeUniques: strategy.threeUniques.filter((_, i) => i !== index) });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>Marketing Strategy</CardTitle>
          </div>
          <VTOAIButton 
            label="Improve Marketing Strategy" 
            onResult={() => {}}
            context={JSON.stringify(strategy)}
            prompt="Improve this marketing strategy"
          />
        </div>
        <CardDescription>Your market positioning and differentiators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Market</label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <VTOEditableField
                  value={strategy.targetMarket}
                  onChange={(value) => onChange({ ...strategy, targetMarket: value })}
                  multiline
                  placeholder="Describe your ideal customer profile..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Guarantee</label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <VTOEditableField
                  value={strategy.guarantee}
                  onChange={(value) => onChange({ ...strategy, guarantee: value })}
                  placeholder="Your promise to customers..."
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Three Uniques™</label>
              <div className="space-y-2">
                {strategy.threeUniques.map((unique, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground w-4">{index + 1}.</span>
                    <Input
                      value={unique}
                      onChange={(e) => updateUnique(index, e.target.value)}
                      placeholder="What makes you unique?"
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeUnique(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {strategy.threeUniques.length < 3 && (
                  <Button variant="outline" onClick={addUnique} size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Unique
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proven Process</label>
              <div className="p-3 bg-muted/50 rounded-lg">
                <VTOEditableField
                  value={strategy.provenProcess}
                  onChange={(value) => onChange({ ...strategy, provenProcess: value })}
                  placeholder="Your repeatable process name..."
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
