import { useNavigate } from 'react-router-dom';
import { 
  Upload, 
  Scissors, 
  Captions, 
  Volume2, 
  Download,
  ArrowRight,
  Sparkles
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
  | 'go-to-projects';

interface AIActionButtonProps {
  action: ActionType;
  label?: string;
  onUploadClick?: () => void;
  projectId?: string;
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
};

export function AIActionButton({ 
  action, 
  label, 
  onUploadClick,
  projectId,
  className 
}: AIActionButtonProps) {
  const navigate = useNavigate();
  const config = actionConfig[action];
  const Icon = config.icon;

  const handleClick = () => {
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
        if (projectId) {
          navigate(`/refiner/${projectId}`);
        }
        break;
      case 'create-clips':
      case 'add-captions':
      case 'clean-audio':
      case 'export':
        // These trigger UI actions in the refiner
        if (projectId) {
          navigate(`/refiner/${projectId}`);
        }
        break;
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(
        "gap-2 mt-2 bg-primary/10 hover:bg-primary/20 border-primary/30 text-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4 text-primary" />
      {label || config.defaultLabel}
    </Button>
  );
}
