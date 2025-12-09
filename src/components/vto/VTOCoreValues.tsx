import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { VTOAIButton } from './VTOAIButton';
import { CoreValue } from '@/types/vto';

interface VTOCoreValuesProps {
  values: CoreValue[];
  onChange: (values: CoreValue[]) => void;
}

export const VTOCoreValues = ({ values, onChange }: VTOCoreValuesProps) => {
  const addValue = () => {
    onChange([...values, { id: crypto.randomUUID(), value: '' }]);
  };

  const updateValue = (id: string, newValue: string) => {
    onChange(values.map(v => v.id === id ? { ...v, value: newValue } : v));
  };

  const removeValue = (id: string) => {
    onChange(values.filter(v => v.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            <CardTitle>Core Values</CardTitle>
          </div>
          <VTOAIButton 
            label="Refine Our Core Values" 
            onResult={() => {}}
            context={values.map(v => v.value).join(', ')}
            prompt="Refine these core values"
          />
        </div>
        <CardDescription>The essential, enduring principles that guide your company</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {values.map((value, index) => (
          <div key={value.id} className="flex items-center gap-2">
            <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
              {index + 1}
            </Badge>
            <Input
              value={value.value}
              onChange={(e) => updateValue(value.id, e.target.value)}
              placeholder="Enter core value..."
              className="flex-1"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeValue(value.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addValue} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Core Value
        </Button>
      </CardContent>
    </Card>
  );
};
