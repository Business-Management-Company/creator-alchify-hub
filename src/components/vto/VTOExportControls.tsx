import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Save, Share2, ChevronDown, Plus, Trash2, Clock, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface SavedVersion {
  id: string;
  name: string;
  savedAt: Date;
  isLive?: boolean;
  isActive?: boolean;
}

interface VTOExportControlsProps {
  onSave: () => void;
  onVersionChange?: (versionId: string) => void;
  onNewDraft?: () => void;
  onDeleteVersion?: (versionId: string) => void;
  savedVersions?: SavedVersion[];
  currentVersionId?: string;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export const VTOExportControls = ({ 
  onSave, 
  onVersionChange,
  onNewDraft,
  onDeleteVersion,
  savedVersions = [],
  currentVersionId,
  contentRef
}: VTOExportControlsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Default versions if none provided
  const versions: SavedVersion[] = savedVersions.length > 0 ? savedVersions : [
    { id: 'current', name: 'Current Draft', savedAt: new Date(), isActive: true },
    { id: 'q3-2025', name: 'Q3 2025 Final', savedAt: new Date('2025-09-30'), isLive: true },
    { id: 'q2-2025', name: 'Q2 2025 Final', savedAt: new Date('2025-06-30') },
  ];

  const currentVersion = versions.find(v => v.id === (currentVersionId || 'current')) || versions[0];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `about ${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast({
      title: 'Generating PDF',
      description: 'Please wait while we create your board presentation...',
    });

    try {
      const element = contentRef?.current || document.querySelector('.vto-content');
      
      if (!element) {
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        pdf.setFillColor(42, 42, 42);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.text('Alchify CEO VTO', pageWidth / 2, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text('Vision/Traction Organizer - Board Presentation', pageWidth / 2, 30, { align: 'center' });
        
        pdf.setTextColor(0, 0, 0);
        let y = 55;
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Core Values', 20, y);
        y += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        const values = ['Authenticity First', 'Creator Empowerment', 'Ethical AI', 'Continuous Innovation'];
        values.forEach(value => {
          pdf.text(`• ${value}`, 25, y);
          y += 7;
        });
        
        y += 10;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('10-Year Target', 20, y);
        y += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('$100M ARR - The go-to platform for every serious content creator', 25, y);
        
        y += 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('3-Year Picture', 20, y);
        y += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('• Revenue: $5M ARR', 25, y); y += 7;
        pdf.text('• Profit: $1M EBITDA', 25, y); y += 7;
        pdf.text('• Team: 25 people', 25, y); y += 7;
        pdf.text('• NPS: 70+, Churn: < 5%, 50K active creators', 25, y);
        
        y += 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('1-Year Plan', 20, y);
        y += 10;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.text('• Revenue Target: $1.2M ARR', 25, y); y += 7;
        pdf.text('• Profit Target: $200K', 25, y);
        
        y += 20;
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('The Ask', 20, y);
        y += 10;
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(212, 160, 23);
        pdf.text('$500K Seed Round', 25, y);
        y += 8;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text('18-month runway to reach $1.2M ARR, 25K users, and Series A readiness.', 25, y);
        
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setFontSize(9);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Confidential - For Board Review Only', pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        
        pdf.save('Alchify-VTO-Board-Presentation.pdf');
        
        toast({
          title: 'PDF Downloaded',
          description: 'Your VTO board presentation has been saved.',
        });
      } else {
        const canvas = await html2canvas(element as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 10;
        
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + 10;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save('Alchify-VTO-Board-Presentation.pdf');
        
        toast({
          title: 'PDF Downloaded',
          description: 'Your VTO board presentation has been saved.',
        });
      }
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error generating the PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveVersion = () => {
    onSave();
    toast({
      title: 'Version Saved',
      description: 'VTO snapshot has been saved',
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Alchify CEO VTO',
      text: 'View the Alchify Vision/Traction Organizer board presentation',
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'VTO link has been copied to your clipboard',
        });
      }
    } catch (error) {
      console.log('Share cancelled');
    }
  };

  const handleNewDraft = () => {
    onNewDraft?.();
    toast({
      title: 'New Draft Created',
      description: 'Starting fresh from current version',
    });
  };

  const handleDeleteVersion = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteVersion?.(versionId);
    toast({
      title: 'Version Deleted',
      description: 'The version has been removed',
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Version Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 min-w-[200px] justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="truncate max-w-[140px]">{currentVersion?.name}</span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[300px] bg-card border border-border z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="font-medium text-sm">Saved Versions</span>
            <Badge variant="secondary" className="rounded-full h-5 w-5 p-0 flex items-center justify-center text-xs">
              {versions.length}
            </Badge>
          </div>
          <DropdownMenuSeparator />
          
          {/* New Draft Option */}
          <DropdownMenuItem onClick={handleNewDraft} className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            <span>New Draft</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          {/* Version List */}
          {versions.map((version) => (
            <DropdownMenuItem 
              key={version.id}
              onClick={() => onVersionChange?.(version.id)}
              className={cn(
                "flex flex-col items-start gap-1 cursor-pointer p-3",
                version.id === currentVersionId && "bg-primary/10 border-l-2 border-primary"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {version.isLive && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
                  <span className="font-medium truncate max-w-[150px]">{version.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {version.isLive && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                      Live
                    </Badge>
                  )}
                  {version.isActive && (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                      Active
                    </Badge>
                  )}
                  {version.id !== 'current' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteVersion(version.id, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTimeAgo(version.savedAt)}</span>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Buttons */}
      <Button onClick={handleSaveVersion} className="gap-2">
        <Save className="h-4 w-4" />
        Save Version
      </Button>
      <Button 
        onClick={handleExportPDF} 
        disabled={isExporting}
        variant="outline"
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {isExporting ? 'Generating...' : 'Download'}
      </Button>
      <Button onClick={handleShare} variant="outline" className="gap-2">
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    </div>
  );
};
