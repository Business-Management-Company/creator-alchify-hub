import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VTOEditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
}

export const VTOEditableField = ({ 
  value, 
  onChange, 
  multiline = false, 
  placeholder = 'Click to edit...',
  className = ''
}: VTOEditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex gap-2 items-start">
        {multiline ? (
          <Textarea
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={`flex-1 ${className}`}
            placeholder={placeholder}
            autoFocus
          />
        ) : (
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className={`flex-1 ${className}`}
            placeholder={placeholder}
            autoFocus
          />
        )}
        <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8">
          <Check className="h-4 w-4 text-green-500" />
        </Button>
        <Button size="icon" variant="ghost" onClick={handleCancel} className="h-8 w-8">
          <X className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`group flex items-start gap-2 cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2 ${className}`}
      onClick={() => setIsEditing(true)}
    >
      <span className={`flex-1 ${!value ? 'text-muted-foreground italic' : ''}`}>
        {value || placeholder}
      </span>
      <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
