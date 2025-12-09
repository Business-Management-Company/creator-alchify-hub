import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { VTOAIButton } from './VTOAIButton';
import { Issue } from '@/types/vto';

interface VTOIssuesProps {
  issues: Issue[];
  onChange: (issues: Issue[]) => void;
}

export const VTOIssues = ({ issues, onChange }: VTOIssuesProps) => {
  const addIssue = () => {
    onChange([...issues, { 
      id: crypto.randomUUID(), 
      title: '', 
      priority: 'medium', 
      forL10: false 
    }]);
  };

  const updateIssue = (id: string, field: keyof Issue, value: any) => {
    onChange(issues.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeIssue = (id: string) => {
    onChange(issues.filter(i => i.id !== id));
  };

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <CardTitle>Issues List</CardTitle>
          </div>
          <VTOAIButton 
            label="Prioritize Issues" 
            onResult={() => {}}
            context={JSON.stringify(issues)}
            prompt="Prioritize these issues"
          />
        </div>
        <CardDescription>Obstacles, barriers, and challenges to address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.map((issue) => (
          <div key={issue.id} className="flex items-center gap-3 p-3 border rounded-lg">
            <Badge variant={getPriorityColor(issue.priority)}>
              {issue.priority.toUpperCase()}
            </Badge>
            <Input
              value={issue.title}
              onChange={(e) => updateIssue(issue.id, 'title', e.target.value)}
              placeholder="Issue description..."
              className="flex-1"
            />
            <Select value={issue.priority} onValueChange={(v) => updateIssue(issue.id, 'priority', v as Issue['priority'])}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={issue.forL10}
                onCheckedChange={(checked) => updateIssue(issue.id, 'forL10', checked)}
              />
              <span className="text-xs text-muted-foreground">L10</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeIssue(issue.id)}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" onClick={addIssue} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Issue
        </Button>
      </CardContent>
    </Card>
  );
};
