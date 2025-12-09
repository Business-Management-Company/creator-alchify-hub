import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mountain, Plus, Trash2, CheckCircle2, Clock, Circle } from 'lucide-react';
import { VTOAIButton } from './VTOAIButton';
import { Rock } from '@/types/vto';

interface VTORocksProps {
  rocks: Rock[];
  onChange: (rocks: Rock[]) => void;
}

export const VTORocks = ({ rocks, onChange }: VTORocksProps) => {
  const addRock = () => {
    onChange([...rocks, { 
      id: crypto.randomUUID(), 
      title: '', 
      owner: '', 
      dueQuarter: 'Q1', 
      status: 'not_started' 
    }]);
  };

  const updateRock = (id: string, field: keyof Rock, value: string) => {
    onChange(rocks.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRock = (id: string) => {
    onChange(rocks.filter(r => r.id !== id));
  };

  const getStatusIcon = (status: Rock['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="h-5 w-5 text-primary" />
            <CardTitle>Quarterly Rocks™</CardTitle>
          </div>
        </div>
        <CardDescription>3-7 most important priorities for this quarter</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rocks.map((rock) => (
          <div key={rock.id} className="p-3 border rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {getStatusIcon(rock.status)}
              <Input
                value={rock.title}
                onChange={(e) => updateRock(rock.id, 'title', e.target.value)}
                placeholder="Rock title..."
                className="flex-1"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeRock(rock.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Input
                value={rock.owner}
                onChange={(e) => updateRock(rock.id, 'owner', e.target.value)}
                placeholder="Owner..."
                className="w-32"
              />
              <Select value={rock.dueQuarter} onValueChange={(v) => updateRock(rock.id, 'dueQuarter', v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1">Q1</SelectItem>
                  <SelectItem value="Q2">Q2</SelectItem>
                  <SelectItem value="Q3">Q3</SelectItem>
                  <SelectItem value="Q4">Q4</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rock.status} onValueChange={(v) => updateRock(rock.id, 'status', v as Rock['status'])}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                </SelectContent>
              </Select>
              <VTOAIButton 
                label="Refine" 
                onResult={() => {}}
                context={rock.title}
                prompt="Refine this rock"
              />
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addRock} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Rock
        </Button>
      </CardContent>
    </Card>
  );
};
