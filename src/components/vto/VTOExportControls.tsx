import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Save, Share2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SavedVersion {
  id: string;
  name: string;
  savedAt: Date;
}

interface VTOExportControlsProps {
  onSave: () => void;
  onVersionChange?: (versionId: string) => void;
  savedVersions?: SavedVersion[];
  currentVersionId?: string;
  contentRef?: React.RefObject<HTMLDivElement>;
}

export const VTOExportControls = ({ 
  onSave, 
  onVersionChange,
  savedVersions = [],
  currentVersionId,
  contentRef
}: VTOExportControlsProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  // Default versions if none provided
  const versions: SavedVersion[] = savedVersions.length > 0 ? savedVersions : [
    { id: 'current', name: 'Current Draft', savedAt: new Date() },
    { id: 'q3-2025', name: 'Q3 2025 Final', savedAt: new Date('2025-09-30') },
    { id: 'q2-2025', name: 'Q2 2025 Final', savedAt: new Date('2025-06-30') },
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    toast({
      title: 'Generating PDF',
      description: 'Please wait while we create your board presentation...',
    });

    try {
      // Get the content element
      const element = contentRef?.current || document.querySelector('.vto-content');
      
      if (!element) {
        // Fallback: Generate a simple text-based PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Header
        pdf.setFillColor(42, 42, 42);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.text('Alchify CEO VTO', pageWidth / 2, 20, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text('Vision/Traction Organizer - Board Presentation', pageWidth / 2, 30, { align: 'center' });
        
        // Content
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
        
        // Footer
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
        // Use html2canvas for full page capture
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
      // User cancelled or error
      console.log('Share cancelled');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 justify-between">
      {/* Version Selector */}
      <Select 
        value={currentVersionId || 'current'} 
        onValueChange={(value) => onVersionChange?.(value)}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select version" />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border">
          {versions.map((version) => (
            <SelectItem key={version.id} value={version.id}>
              {version.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Generating...' : 'Download PDF'}
        </Button>
        <Button onClick={handleShare} variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share
        </Button>
        <Button onClick={handleSaveVersion} variant="outline" className="gap-2">
          <Save className="h-4 w-4" />
          Save Version
        </Button>
      </div>
    </div>
  );
};
