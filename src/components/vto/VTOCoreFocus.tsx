import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crosshair } from 'lucide-react';
import { VTOEditableField } from './VTOEditableField';
import { VTOAIButton } from './VTOAIButton';
import { CoreFocus } from '@/types/vto';

interface VTOCoreFocusProps {
  coreFocus: CoreFocus;
  onChange: (coreFocus: CoreFocus) => void;
}

export const VTOCoreFocus = ({ coreFocus, onChange }: VTOCoreFocusProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            <CardTitle>Core Focus™</CardTitle>
          </div>
          <VTOAIButton 
            label="Sharpen Our Core Focus" 
            onResult={() => {}}
            context={`Purpose: ${coreFocus.purpose}, Niche: ${coreFocus.niche}`}
            prompt="Sharpen this core focus"
          />
        </div>
        <CardDescription>Your organization's reason for being and what you do best</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Purpose / Cause / Passion</label>
          <div className="p-3 bg-muted/50 rounded-lg">
            <VTOEditableField
              value={coreFocus.purpose}
              onChange={(value) => onChange({ ...coreFocus, purpose: value })}
              multiline
              placeholder="What is your organization's higher purpose?"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Niche</label>
          <div className="p-3 bg-muted/50 rounded-lg">
            <VTOEditableField
              value={coreFocus.niche}
              onChange={(value) => onChange({ ...coreFocus, niche: value })}
              multiline
              placeholder="What does your company do better than anyone else?"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
