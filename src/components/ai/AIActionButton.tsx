import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Scissors, 
  Captions, 
  Volume2, 
  Download,
  ArrowRight,
  Sparkles,
  Wand2,
  FileText,
  Instagram
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ActionType = 
  | 'upload' 
  | 'create-clips' 
  | 'add-captions' 
  | 'clean-audio' 
  | 'export' 
  | 'go-to-refiner'
  | 'go-to-projects'
  | 'alchify'
  | 'transcript-only'
  | 'instagram-story';

interface AIActionButtonProps {
  action: ActionType;
  label?: string;
  onUploadClick?: () => void;
  projectId?: string;
  onAction?: (action: ActionType) => void;
  className?: string;
}

const actionConfig: Record<ActionType, { icon: React.ElementType; defaultLabel: string; path?: string }> = {
  'upload': { icon: Upload, defaultLabel: 'Upload Content' },
  'create-clips': { icon: Scissors, defaultLabel: 'Create Clips' },
  'add-captions': { icon: Captions, defaultLabel: 'Add Captions' },
  'clean-audio': { icon: Volume2, defaultLabel: 'Clean Audio' },
  'export': { icon: Download, defaultLabel: 'Export' },
  'go-to-refiner': { icon: Sparkles, defaultLabel: 'Open in Refiner' },
  'go-to-projects': { icon: ArrowRight, defaultLabel: 'View Projects', path: '/projects' },
  'alchify': { icon: Wand2, defaultLabel: 'Alchify it' },
  'transcript-only': { icon: FileText, defaultLabel: 'Transcript only' },
  'instagram-story': { icon: Instagram, defaultLabel: 'Instagram Story' },
};

export function AIActionButton({ 
  action, 
  label, 
  onUploadClick,
  projectId,
  onAction,
  className 
}: AIActionButtonProps) {
  const navigate = useNavigate();
  const config = actionConfig[action];
  const Icon = config.icon;

  const handleClick = () => {
    // If custom onAction handler provided, use it
    if (onAction) {
      onAction(action);
      return;
    }

    switch (action) {
      case 'upload':
        if (onUploadClick) {
          onUploadClick();
        } else {
          navigate('/upload');
        }
        break;
      case 'go-to-projects':
        navigate('/projects');
        break;
      case 'go-to-refiner':
      case 'alchify':
        if (projectId) {
          navigate(`/refiner/${projectId}`);
        }
        break;
      case 'create-clips':
      case 'add-captions':
      case 'clean-audio':
      case 'export':
      case 'transcript-only':
      case 'instagram-story':
        // Navigate to refiner with the project
        if (projectId) {
          navigate(`/refiner/${projectId}`);
        }
        break;
    }
  };

  // Highlight "Alchify" button with gradient
  const isAlchify = action === 'alchify';

  return (
    <Button
      variant={isAlchify ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      className={cn(
        "gap-2 mt-2",
        isAlchify 
          ? "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-md" 
          : "bg-primary/10 hover:bg-primary/20 border-primary/30 text-foreground",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", isAlchify ? "" : "text-primary")} />
      {label || config.defaultLabel}
    </Button>
  );
}
