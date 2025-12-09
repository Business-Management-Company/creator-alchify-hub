import { Button } from '@/components/ui/button';
import { Download, Save, GitCompare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VTOExportControlsProps {
  onSave: () => void;
}

export const VTOExportControls = ({ onSave }: VTOExportControlsProps) => {
  const { toast } = useToast();

  const handleExportPDF = () => {
    toast({
      title: 'Export Started',
      description: 'Generating PDF of your VTO...',
    });
    // In production, this would generate an actual PDF
    setTimeout(() => {
      toast({
        title: 'PDF Ready',
        description: 'Your VTO has been exported',
      });
    }, 1500);
  };

  const handleSaveVersion = () => {
    onSave();
    toast({
      title: 'Version Saved',
      description: 'VTO snapshot has been saved',
    });
  };

  const handleCompareVersions = () => {
    toast({
      title: 'Compare Versions',
      description: 'Version comparison coming soon',
    });
  };

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Button onClick={handleExportPDF} className="gap-2">
        <Download className="h-4 w-4" />
        Export VTO (PDF)
      </Button>
      <Button onClick={handleSaveVersion} variant="outline" className="gap-2">
        <Save className="h-4 w-4" />
        Save Version
      </Button>
      <Button onClick={handleCompareVersions} variant="outline" className="gap-2">
        <GitCompare className="h-4 w-4" />
        Compare Versions
      </Button>
    </div>
  );
};
