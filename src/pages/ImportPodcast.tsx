import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";

const ImportPodcast = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rssUrl, setRssUrl] = useState("");
  const [rssFeedUrl, setRssFeedUrl] = useState<string | null>(null);

  const [parsedData, setParsedData] = useState<any>(null);
  const [episodeLimit, setEpisodeLimit] = useState(50);

  // Unified mutation: parse + insert via Edge Function
  const importFeed = useMutation({
    mutationFn: async (url: string) => {
      if (!user) throw new Error("User not authenticated");

      // 1️⃣ Call the import-rss-feed function
      const { data, error } = await supabase.functions.invoke(
        "import-rss-feed",
        {
          body: { rssUrl: url, episodeLimit },
        },
      );

      if (error) throw error;

      // 2️⃣ Return imported data
      return data;
    },
    onSuccess: (data) => {
      setParsedData(data);
      toast.success("Podcast imported successfully!");
      queryClient.invalidateQueries({ queryKey: ["podcasts"] });

      // 3️⃣ Generate RSS feed URL (separate function)
      const feedUrl = `https://zvajqjckngmkbhqiaefr.supabase.co/functions/v1/generate-rss?slug=${data.podcast.slug}`;
      setRssFeedUrl(feedUrl); // <-- Add this state in your component: const [rssFeedUrl, setRssFeedUrl] = useState<string | null>(null);

      // 4️⃣ Optional: You can navigate later or let user copy feed URL first
      // setTimeout(() => {
      //   navigate(`/podcasts/${data.podcast.id}`);
      // }, 500);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to import podcast");
    },
  });

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rssUrl) {
      toast.error("Please enter an RSS feed URL");
      return;
    }
    importFeed.mutate(rssUrl);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/podcasts")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Podcasts
          </Button>

          <Card className="p-6">
            <h1 className="text-3xl font-bold mb-2">Import Podcast from RSS</h1>
            <p className="text-muted-foreground mb-6">
              Enter your existing podcast RSS feed URL to import all episodes
              and metadata
            </p>

            <form onSubmit={handleImport} className="space-y-4 mb-6">
              <div>
                <Label htmlFor="rssUrl">RSS Feed URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="rssUrl"
                    type="url"
                    value={rssUrl}
                    onChange={(e) => setRssUrl(e.target.value)}
                    placeholder="https://example.com/podcast/feed.xml"
                    className="flex-1"
                    disabled={importFeed.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={importFeed.isPending || !rssUrl}
                  >
                    {importFeed.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import Podcast
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>

            {parsedData && (
              <div className="space-y-6">
                {/* Success Message */}
                <div className="flex items-start gap-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-500 mb-1">
                      Podcast Imported Successfully!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {parsedData.episodes.length} episodes imported.
                    </p>
                  </div>
                </div>

                {/* Podcast Details */}
                <div className="border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">Podcast Details</h2>
                  <div className="flex gap-6">
                    {parsedData.podcast.cover_image_url && (
                      <img
                        src={parsedData.podcast.cover_image_url}
                        alt={parsedData.podcast.title}
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="text-2xl font-bold">
                        {parsedData.podcast.title}
                      </h3>
                      <p className="text-muted-foreground line-clamp-3">
                        {parsedData.podcast.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.podcast.category && (
                          <Badge variant="secondary">
                            {parsedData.podcast.category}
                          </Badge>
                        )}
                        {parsedData.podcast.is_explicit && (
                          <Badge variant="destructive">Explicit</Badge>
                        )}
                        <Badge>{parsedData.podcast.language}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Episodes Preview */}
                <div className="border rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">
                    Episodes Preview (showing{" "}
                    {Math.min(10, parsedData.episodes.length)} of{" "}
                    {parsedData.episodes.length})
                  </h2>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {parsedData.episodes
                      .slice(0, 10)
                      .map((episode: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold">{episode.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {episode.description}
                              </p>
                            </div>
                            {episode.durationSeconds > 0 && (
                              <span className="text-sm text-muted-foreground ml-2">
                                {Math.floor(episode.durationSeconds / 60)}m
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    {parsedData.episodes.length > 10 && (
                      <p className="text-center text-sm text-muted-foreground py-2">
                        + {parsedData.episodes.length - 10} more episodes
                      </p>
                    )}
                  </div>
                </div>
                {rssFeedUrl && (
                  <div className="border rounded-lg p-4 bg-blue-50 mt-6 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Your RSS feed URL (ready for Apple Podcasts, Spotify,
                        etc.):
                      </p>
                      <a
                        href={rssFeedUrl}
                        target="_blank"
                        className="text-blue-600 font-medium break-all"
                      >
                        {rssFeedUrl}
                      </a>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rssFeedUrl);
                        toast.success("RSS feed URL copied to clipboard!");
                      }}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default ImportPodcast;
