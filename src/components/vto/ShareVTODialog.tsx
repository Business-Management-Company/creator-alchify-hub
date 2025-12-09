import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Share2, Eye, Mail, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  name: string;
  email: string;
  contact_type: string;
  company?: string;
  title?: string;
}

interface ShareVTODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionName?: string;
}

export const ShareVTODialog = ({ open, onOpenChange, versionName = 'Current VTO' }: ShareVTODialogProps) => {
  const { toast } = useToast();
  const [shareMode, setShareMode] = useState<'view' | 'share' | 'email'>('email');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchContacts();
    }
  }, [open]);

  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .in('contact_type', ['board_member', 'board_observer', 'advisor'])
      .order('name');

    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }

    setContacts(data || []);
    setSelectedContacts((data || []).map(c => c.id));
  };

  const toggleContact = (contactId: string) => {
    setSelectedContacts(prev => {
      if (prev.includes(contactId)) {
        return prev.filter(id => id !== contactId);
      }
      return [...prev, contactId];
    });
    setSendToAll(false);
  };

  const toggleSendToAll = () => {
    if (sendToAll) {
      setSelectedContacts([]);
      setSendToAll(false);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
      setSendToAll(true);
    }
  };

  const formatContactType = (type: string) => {
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const handleShare = async () => {
    setIsLoading(true);

    try {
      if (shareMode === 'view') {
        // Copy link and navigate to board portal view
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Link Copied',
          description: 'VTO link copied. Opening board portal view...',
        });
        // In production, would navigate to board portal
      } else if (shareMode === 'share') {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: 'Shared to Board Portal',
          description: 'VTO has been shared to the board portal.',
        });
      } else if (shareMode === 'email') {
        const recipientCount = selectedContacts.length;
        if (recipientCount === 0) {
          toast({
            title: 'No Recipients',
            description: 'Please select at least one recipient.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        // In production, this would send emails via edge function
        toast({
          title: 'Emails Sent',
          description: `VTO shared and email notification sent to ${recipientCount} board member${recipientCount > 1 ? 's' : ''}.`,
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'There was an error sharing the VTO.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Share VTO to Board
          </DialogTitle>
          <DialogDescription>
            Share "{versionName}" to the Board Portal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Share Mode Options */}
          <RadioGroup value={shareMode} onValueChange={(value: 'view' | 'share' | 'email') => setShareMode(value)}>
            <div
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                shareMode === 'view' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
              onClick={() => setShareMode('view')}
            >
              <RadioGroupItem value="view" id="view" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="view" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Eye className="h-4 w-4" />
                  Share and View
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Share to Board Portal and navigate to view it
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                shareMode === 'share' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
              onClick={() => setShareMode('share')}
            >
              <RadioGroupItem value="share" id="share" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="share" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Share2 className="h-4 w-4" />
                  Share Only
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Share to Board Portal without navigating
                </p>
              </div>
            </div>

            <div
              className={cn(
                "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors",
                shareMode === 'email' ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
              )}
              onClick={() => setShareMode('email')}
            >
              <RadioGroupItem value="email" id="email" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="email" className="flex items-center gap-2 cursor-pointer font-medium">
                  <Mail className="h-4 w-4" />
                  Share and Email Board
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Share and send email notification to board members
                </p>
              </div>
            </div>
          </RadioGroup>

          {/* Recipients Section (only shown for email mode) */}
          {shareMode === 'email' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Select Recipients
                </Label>
                <button
                  type="button"
                  onClick={toggleSendToAll}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Checkbox checked={sendToAll} />
                  Send to All
                </button>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-lg border border-border p-2">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No board members added yet. Add contacts in Admin → Contacts.
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => toggleContact(contact.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedContacts.includes(contact.id) ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox checked={selectedContacts.includes(contact.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {contact.email} · {formatContactType(contact.contact_type)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={isLoading} className="gap-2">
            <Share2 className="h-4 w-4" />
            {shareMode === 'email' ? 'Share & Send Email' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
