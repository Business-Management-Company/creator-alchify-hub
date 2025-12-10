import { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Loader2, 
  Download, 
  X,
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
      <div className="bg-gradient-to-br from-card via-card to-primary/5 border border-border hover:border-primary/30 rounded-2xl p-6 transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-1">
              Refiner AI Deep Dive
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get a comprehensive analysis of your performance, bottlenecks, and opportunities with a personalized weekly action plan.
            </p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Performance Analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                <span>Growth Opportunities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Weekly Plan</span>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <DialogTitle className="text-xl font-bold">
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
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {report && (
                <div 
                  className="text-sm text-foreground whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: report
                      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 text-primary">$1</h2>')
                      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                      .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
                      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
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
