import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface VTOAIButtonProps {
  label: string;
  onResult: (result: string) => void;
  context: string;
  prompt: string;
}

export const VTOAIButton = ({ label, onResult, context, prompt }: VTOAIButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      // Simulate AI response for now - would connect to actual AI endpoint
      toast({
        title: 'AI Generating...',
        description: 'Refiner AI is analyzing your data',
      });
      
      // Placeholder - in production this would call the AI endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: 'AI Complete',
        description: 'Suggestions have been applied',
      });
      
      onResult(`AI-enhanced: ${context}`);
    } catch (error) {
      toast({
        title: 'AI Error',
        description: 'Failed to generate AI suggestions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 text-primary" />
      )}
      {label}
    </Button>
  );
};
