import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Rss, Loader2, CloudDownload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImportRSSButtonProps {
  onImportComplete: (podcastId: string) => void;
}

export const ImportRSSButton = ({ onImportComplete }: ImportRSSButtonProps) => {
  const navigate = useNavigate();
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
      console.log("Importing from RSS URL:", rssUrl);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const podcastId = `podcast_${Date.now()}`;

      toast.success("Podcast imported successfully!");
      setRssUrl("");
      setOpen(false);
      onImportComplete(podcastId);
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
        onClick={() => navigate("/podcast/import")}
      >
        <CloudDownload className="w-5 h-5 mr-2" />
        Import from RSS
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Podcast from RSS Feed</DialogTitle>
            <DialogDescription>Enter your podcast's RSS feed URL to import episodes and metadata</DialogDescription>
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
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={loading} className="text-white ">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CloudDownload className="w-4 h-4" />
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
