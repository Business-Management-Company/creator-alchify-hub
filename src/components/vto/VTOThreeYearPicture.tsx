import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { VTOEditableField } from './VTOEditableField';
import { VTOAIButton } from './VTOAIButton';
import { ThreeYearPicture } from '@/types/vto';

interface VTOThreeYearPictureProps {
  picture: ThreeYearPicture;
  onChange: (picture: ThreeYearPicture) => void;
}

export const VTOThreeYearPicture = ({ picture, onChange }: VTOThreeYearPictureProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>3-Year Picture™</CardTitle>
          </div>
          <VTOAIButton 
            label="Create a 3-Year Picture" 
            onResult={() => {}}
            context={JSON.stringify(picture)}
            prompt="Create a compelling 3-year picture"
          />
        </div>
        <CardDescription>What your organization looks like in three years</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <label className="text-sm font-medium text-muted-foreground">Revenue</label>
            <VTOEditableField
              value={picture.revenue}
              onChange={(value) => onChange({ ...picture, revenue: value })}
              placeholder="$5M"
              className="text-2xl font-bold text-center"
            />
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <label className="text-sm font-medium text-muted-foreground">Profit / EBITDA</label>
            <VTOEditableField
              value={picture.profit}
              onChange={(value) => onChange({ ...picture, profit: value })}
              placeholder="$1M"
              className="text-2xl font-bold text-center"
            />
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <label className="text-sm font-medium text-muted-foreground">Team Size</label>
            <VTOEditableField
              value={picture.teamSize}
              onChange={(value) => onChange({ ...picture, teamSize: value })}
              placeholder="25 people"
              className="text-2xl font-bold text-center"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Key Metrics</label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <VTOEditableField
                value={picture.keyMetrics}
                onChange={(value) => onChange({ ...picture, keyMetrics: value })}
                multiline
                placeholder="NPS 70+, Churn < 5%, 50K active users..."
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Milestones</label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <VTOEditableField
                value={picture.productMilestones}
                onChange={(value) => onChange({ ...picture, productMilestones: value })}
                multiline
                placeholder="Mobile app launched, API available..."
              />
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">What Success Looks Like</label>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <VTOEditableField
              value={picture.successNarrative}
              onChange={(value) => onChange({ ...picture, successNarrative: value })}
              multiline
              placeholder="Describe the future state in vivid detail. What does the company look like? How does it feel? What are people saying about you?"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
