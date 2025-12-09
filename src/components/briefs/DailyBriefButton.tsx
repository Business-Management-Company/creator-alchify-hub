import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Newspaper } from 'lucide-react';
import { DailyBriefViewer } from './DailyBriefViewer';

export function DailyBriefButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Newspaper className="h-4 w-4" />
          Daily Brief
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Competitive Intelligence Brief</DialogTitle>
        </DialogHeader>
        <DailyBriefViewer />
      </DialogContent>
    </Dialog>
  );
}
