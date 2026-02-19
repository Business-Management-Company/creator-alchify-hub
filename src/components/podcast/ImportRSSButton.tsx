import { Button } from "@/components/ui/button";
import { Rss, Loader2 , CloudDownload} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface ImportRSSButtonProps {
  onImportComplete: (podcastId: string) => void;
}

export const ImportRSSButton = ({ onImportComplete }: ImportRSSButtonProps) => {
  const [open, setOpen] = useState(false);
  const [rssUrl, setRssUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!rssUrl.trim()) {
      toast.error("Please enter an RSS feed URL");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-rss-feed", {
        body: { rssUrl: rssUrl.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const podcastId = data?.podcast?.id;
      toast.success(`Podcast imported with ${data?.episodeCount || 0} episodes!`);
      setRssUrl("");
      setOpen(false);
      if (podcastId) onImportComplete(podcastId);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import podcast");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="default"
        size="lg"
        className="text-base font-semibold border-2"
        onClick={() => setOpen(true)}
      >
        <CloudDownload className="w-5 h-5 mr-2" />
        Import from RSS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Podcast from RSS Feed</DialogTitle>
            <DialogDescription>
              Enter your podcast's RSS feed URL to import episodes and metadata
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rss-url">RSS Feed URL</Label>
              <Input
                id="rss-url"
                placeholder="https://example.com/podcast/feed.xml"
                value={rssUrl}
                onChange={(e) => setRssUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading}
                className="text-white "
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CloudDownload  className="w-4 h-4" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
