import { FileText, Copy, Download, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface TranscriptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  content: string | null;
  wordCount: number | null;
  segments: any[] | null;
  avgConfidence: number | null;
}

export function TranscriptSheet({
  isOpen,
  onClose,
  content,
  wordCount,
  segments,
  avgConfidence,
}: TranscriptSheetProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'Transcript copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (content) {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transcript.txt';
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: 'Downloaded!',
        description: 'Transcript saved as transcript.txt',
      });
    }
  };

  // Format content with timestamps if segments are available
  const formattedContent = content || '';

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[60vh] p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle>Transcript</SheetTitle>
                <SheetDescription className="flex items-center gap-3 mt-1">
                  <Badge variant="secondary">{wordCount || 0} words</Badge>
                  <Badge variant="secondary">{Math.round((avgConfidence || 0.95) * 100)}% accuracy</Badge>
                </SheetDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(60vh-100px)] px-6 py-4">
          {content ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                {formattedContent}
              </p>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transcript available yet.</p>
              <p className="text-sm">Process your content to generate a transcript.</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
