import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Download, Loader2, CheckCircle2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

const ImportPodcast = () => {
  const navigate = useNavigate();
  const [rssUrl, setRssUrl] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [episodeLimit, setEpisodeLimit] = useState(50); // Default limit

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const parseFeed = useMutation({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke("import-rss-feed", {
        body: { rssUrl: url },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setParsedData(data);
      // Set smart default based on episode count
      if (data.episodes.length > 100) {
        setEpisodeLimit(50);
      } else {
        setEpisodeLimit(Math.min(data.episodes.length, 100));
      }
      toast.success("RSS feed parsed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to parse RSS feed");
    },
  });

  const importPodcast = useMutation({
    mutationFn: async () => {
      if (!user || !parsedData) throw new Error("Missing data");

      // Check if podcast with this RSS URL already exists
      const { data: existingPodcast } = await (supabase as any)
        .from("podcasts")
        .select("id, title")
        .eq("source_url", rssUrl)
        .maybeSingle();

      if (existingPodcast) {
        throw new Error(`This RSS feed has already been imported as "${existingPodcast.title}"`);
      }

      // Generate unique slug
      const baseSlug = parsedData.podcast.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists and append number if needed
      while (true) {
        const { data: existing } = await (supabase as any)
          .from("podcasts")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        
        if (!existing) break;
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create podcast
      const { data: podcast, error: podcastError } = await (supabase as any)
        .from("podcasts")
        .insert({
          user_id: user.id,
          slug: slug,
          title: parsedData.podcast.title,
          description: parsedData.podcast.description,
          cover_image_url: parsedData.podcast.cover_image_url,
          author: parsedData.podcast.author_name,
          author_email: parsedData.podcast.author_email,
          website_url: parsedData.podcast.website_url,
          language: parsedData.podcast.language,
          category: parsedData.podcast.category,
          is_explicit: parsedData.podcast.is_explicit,
          is_published: true,
          show_on_profile: true,
          rss_feed_url: rssUrl,
          source: "rss",
          source_url: rssUrl,
        })
        .select()
        .single();

      if (podcastError) throw podcastError;

      // Create episodes (limited to selected number of most recent episodes)
      // Filter out episodes without audio URLs first
      const episodesWithAudio = parsedData.episodes.filter((ep: any) => 
        ep.audioUrl && ep.audioUrl.trim() !== ''
      );
      
      const episodesToImport = episodesWithAudio.slice(0, episodeLimit);
      
      if (episodesToImport.length === 0) {
        throw new Error("No valid episodes with audio URLs found in RSS feed");
      }
      
      const episodesData = episodesToImport.map((ep: any) => ({
        podcast_id: podcast.id,
        title: ep.title,
        description: ep.description,
        audio_url: ep.audioUrl,
        file_size_bytes: ep.fileSizeBytes,
        duration_seconds: ep.durationSeconds,
        publish_date: ep.pubDate || new Date().toISOString(),
        episode_number: ep.episodeNumber,
        season_number: ep.seasonNumber,
        is_published: true,
        source: "rss",
        guid: ep.guid,
      }));

      // Wrap episode insertion in try-catch for rollback
      try {
        const { error: episodesError } = await (supabase as any)
          .from("episodes")
          .upsert(episodesData, { 
            onConflict: 'guid',
            ignoreDuplicates: false 
          });

        if (episodesError) throw episodesError;
      } catch (episodeError: any) {
        // Rollback: Delete the podcast if episode creation fails
        console.error("Episode creation failed, rolling back podcast:", episodeError);
        await (supabase as any).from("podcasts").delete().eq("id", podcast.id);
        throw new Error(episodeError.message || "Failed to import episodes");
      }

      const skippedCount = parsedData.episodes.length - episodesToImport.length;
      const invalidCount = parsedData.episodes.length - episodesWithAudio.length;
      
      if (invalidCount > 0) {
        toast.info(`${invalidCount} episodes skipped (no audio URL)`);
      }
      if (skippedCount > invalidCount) {
        toast.success(`Imported ${episodesToImport.length} episodes. ${skippedCount} older episodes skipped.`);
      }

      return podcast;
    },
    onSuccess: (podcast) => {
      toast.success("Podcast imported successfully!");
      // Small delay to ensure database transaction completes
      setTimeout(() => {
        navigate(`/podcasts`);
      }, 500);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to import podcast");
    },
  });

  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rssUrl) {
      toast.error("Please enter an RSS feed URL");
      return;
    }
    parseFeed.mutate(rssUrl);
  };

  const handleImport = () => {
    importPodcast.mutate();
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
            Enter your existing podcast RSS feed URL to import all episodes and metadata
          </p>

          <form onSubmit={handleParse} className="space-y-4 mb-6">
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
                  disabled={parseFeed.isPending || !!parsedData}
                />
                {!parsedData && (
                  <Button
                    type="submit"
                    disabled={parseFeed.isPending || !rssUrl}
                  >
                    {parseFeed.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Parse Feed
                      </>
                    )}
                  </Button>
                )}
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
                    Feed Parsed Successfully!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Found {parsedData.episodes.length} episodes. Review the details below and select how many to import.
                  </p>
                </div>
              </div>

              {/* Warning for large podcasts */}
              {parsedData.episodes.length > 100 && (
                <div className="flex items-start gap-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-500 mb-1">
                      Large Podcast Detected ({parsedData.episodes.length} episodes)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      This podcast has many episodes. On the free plan, we recommend importing 
                      the most recent 50-100 episodes to start. You can sync more episodes later 
                      or upgrade to a paid plan for unlimited imports.
                    </p>
                  </div>
                </div>
              )}

              {/* Episode Limit Selector */}
              <div className="border rounded-lg p-6 space-y-4">
                <div>
                  <Label htmlFor="episodeLimit" className="text-lg font-semibold">
                    Number of Episodes to Import
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Total episodes available: {parsedData.episodes.length}
                  </p>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Button
                      type="button"
                      variant={episodeLimit === 10 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEpisodeLimit(10)}
                    >
                      Last 10
                    </Button>
                    <Button
                      type="button"
                      variant={episodeLimit === 50 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEpisodeLimit(50)}
                    >
                      Last 50
                    </Button>
                    <Button
                      type="button"
                      variant={episodeLimit === 100 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setEpisodeLimit(100)}
                    >
                      Last 100
                    </Button>
                    {parsedData.episodes.length <= 500 && (
                      <Button
                        type="button"
                        variant={episodeLimit === parsedData.episodes.length ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEpisodeLimit(parsedData.episodes.length)}
                      >
                        All ({parsedData.episodes.length})
                      </Button>
                    )}
                  </div>
                  <Input
                    id="episodeLimit"
                    type="number"
                    min="1"
                    max={Math.min(parsedData.episodes.length, 500)}
                    value={episodeLimit}
                    onChange={(e) => setEpisodeLimit(Math.min(parseInt(e.target.value) || 50, 500))}
                    className="max-w-xs"
                  />
                  {parsedData.episodes.length > 500 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Maximum 500 episodes on free plan. Upgrade to import unlimited episodes.
                    </p>
                  )}
                </div>
              </div>

              {/* Podcast Preview */}
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
                    <h3 className="text-2xl font-bold">{parsedData.podcast.title}</h3>
                    <p className="text-muted-foreground line-clamp-3">
                      {parsedData.podcast.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.podcast.category && (
                        <Badge variant="secondary">{parsedData.podcast.category}</Badge>
                      )}
                      {parsedData.podcast.is_explicit && (
                        <Badge variant="destructive">Explicit</Badge>
                      )}
                      <Badge>{parsedData.podcast.language}</Badge>
                    </div>
                    {parsedData.podcast.author_name && (
                      <p className="text-sm text-muted-foreground">
                        by {parsedData.podcast.author_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Episodes Preview */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">
                  Episodes Preview (showing {Math.min(episodeLimit, parsedData.episodes.length)} of {parsedData.episodes.length})
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {parsedData.episodes.slice(0, Math.min(episodeLimit, 10)).map((episode: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{episode.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {episode.description}
                          </p>
                        </div>
                        {episode.duration_seconds > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            {Math.floor(episode.duration_seconds / 60)}m
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {episodeLimit > 10 && (
                    <p className="text-center text-sm text-muted-foreground py-2">
                      + {episodeLimit - 10} more episodes will be imported
                    </p>
                  )}
                  {parsedData.episodes.length > episodeLimit && (
                    <p className="text-center text-sm text-muted-foreground py-2 border-t">
                      {parsedData.episodes.length - episodeLimit} older episodes will not be imported
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importPodcast.isPending}
                  className="flex-1"
                  size="lg"
                >
                  {importPodcast.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Import Podcast & {Math.min(episodeLimit, parsedData.episodes.length)} Episodes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setParsedData(null);
                    setRssUrl("");
                  }}
                  disabled={importPodcast.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      </div>
    </AppLayout>
    
  );
};



export default ImportPodcast;
