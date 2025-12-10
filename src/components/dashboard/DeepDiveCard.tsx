import { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Loader2, 
  Download,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeepDiveCardProps {
  onGenerateReport: () => Promise<string | null>;
  isGenerating: boolean;
}

export function DeepDiveCard({ onGenerateReport, isGenerating }: DeepDiveCardProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleGenerateReport = async () => {
    const generatedReport = await onGenerateReport();
    if (generatedReport) {
      setReport(generatedReport);
      setIsReportOpen(true);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alchify-performance-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 hover:border-primary/40 rounded-2xl p-5 transition-all duration-300 h-full">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground mb-1">
              Refiner AI Deep Dive
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Get a comprehensive analysis of your performance, bottlenecks, and opportunities with a personalized weekly action plan.
            </p>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Performance Analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                <span>Growth Opportunities</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Weekly Plan</span>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              variant="default"
              size="sm"
              className="bg-primary/90 hover:bg-primary text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate My Report
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Your Performance Deep Dive
                </DialogTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReport}
                className="mr-8"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none">
              {report && (
                <div 
                  className="text-sm text-foreground [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-4 [&_h1]:text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-primary [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground [&_li]:ml-4 [&_li]:text-foreground [&_strong]:text-foreground [&_p]:text-foreground [&_br]:leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: report
                      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                      .replace(/^\* (.*$)/gim, '<li>$1</li>')
                      .replace(/^\d+\. (.*$)/gim, '<li class="list-decimal">$1</li>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
