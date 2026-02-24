import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Pause, Clock, Calendar, Music } from "lucide-react";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import AudioPlayer from "@/components/AudioPlayer";
import type { Episode } from "@/types/podcast";

const PublicPodcastDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { playEpisode, pauseEpisode, resumeEpisode, currentEpisode } = useAudioPlayer();
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const { data: podcast, isLoading } = useQuery({
    queryKey: ["public-podcast", slug],
    queryFn: async () => {
      // First get the podcast
      const { data: podcastData, error: podcastError } = await supabase
        .from("podcasts")
        .select("id, title, description, image_url, category, language, status, author, website_url")
        .eq("id", slug)
        .eq("status", "published")
        .single();

      if (podcastError) throw podcastError;

      // Then get its published episodes
      const { data: episodes, error: episodesError } = await supabase
        .from("episodes")
        .select("id, title, description, audio_url, duration_seconds, pub_date, status, created_at")
        .eq("podcast_id", podcastData.id)
        .eq("status", "published")
        .order("pub_date", { ascending: false });

      if (episodesError) throw episodesError;

      return {
        ...podcastData,
        episodes: episodes || []
      };
    },
    enabled: !!slug,
  });

  const handlePlayEpisode = async (episode: Episode) => {
    if (!episode.audio_url) return;

    // If the DB already stores a full URL, use it directly (don't try to sign it)
    if (/^https?:\/\//i.test(episode.audio_url)) {
      playEpisode({
        id: episode.id,
        title: episode.title,
        audioUrl: episode.audio_url,
        podcastTitle: podcast?.title || "Unknown Podcast",
        podcastId: podcast?.id,
        duration: episode.duration_seconds || 0,
      });
      return;
    }

    // If clicking the same episode that's currently playing, pause it
    if (currentEpisode?.id === episode.id && currentEpisode?.isPlaying) {
      pauseEpisode();
      return;
    }

    // If clicking the same episode that's paused, resume it
    if (currentEpisode?.id === episode.id && !currentEpisode?.isPlaying) {
      resumeEpisode();
      return;
    }

    // If clicking a different episode, get a signed URL (if needed) and play it
    const storagePath = (() => {
      const raw = episode.audio_url ?? "";
      let p = raw.trim().replace(/^\/+/, "");

      const supabasePublicMatch = p.match(/storage\/v1\/object\/(?:public|sign)\/media-uploads\/(.+)$/i);
      if (supabasePublicMatch?.[1]) return supabasePublicMatch[1];

      if (p.toLowerCase().startsWith("media-uploads/")) {
        p = p.slice("media-uploads/".length);
      }

      return p;
    })();
    let audioUrl = signedUrls[storagePath];

    if (!audioUrl) {
      try {
        const { data, error } = await supabase.storage
          .from("media-uploads")
          .createSignedUrl(storagePath, 3600);

        if (error || !data?.signedUrl) {
          const { data: publicData } = supabase.storage
            .from("media-uploads")
            .getPublicUrl(storagePath);

          if (publicData?.publicUrl) {
            audioUrl = publicData.publicUrl;
            setSignedUrls((prev) => ({ ...prev, [storagePath]: publicData.publicUrl }));
          } else {
            console.error("Failed to get signed URL for public episode", error);
            return;
          }
        } else {
          audioUrl = data.signedUrl;
          setSignedUrls((prev) => ({ ...prev, [storagePath]: data.signedUrl }));
        }
      } catch (err) {
        console.error("Unexpected error creating signed URL for public episode", err);
        return;
      }
    }

    playEpisode({
      id: episode.id,
      title: episode.title,
      audioUrl,
      podcastTitle: podcast?.title || "Unknown Podcast",
      podcastId: podcast?.id,
      duration: episode.duration_seconds || 0,
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Podcast not found</h2>
          <p className="text-muted-foreground">This podcast may not be published or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const publishedEpisodes = podcast.episodes || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-4xl mx-auto p-6">
        {/* Podcast Header */}
        <div className="mb-8 flex items-center gap-6">
          {podcast.image_url ? (
            <img
              src={podcast.image_url}
              alt={podcast.title}
              className="w-32 h-32 object-cover rounded-lg shrink-0"
            />
          ) : (
            <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg shrink-0 flex items-center justify-center">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{podcast.title}</h1>
            {podcast.description && (
              <p className="text-muted-foreground mb-4 max-w-2xl">
                {podcast.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{publishedEpisodes.length} episodes</span>
              {podcast.category && (
                <>
                  <span>•</span>
                  <span>{podcast.category}</span>
                </>
              )}
              {podcast.author && (
                <>
                  <span>•</span>
                  <span>by {podcast.author}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Episodes */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-6">Episodes</h2>

          {publishedEpisodes.length === 0 ? (
            <Card className="p-12 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No episodes available</h3>
              <p className="text-muted-foreground">Check back later for new episodes.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {publishedEpisodes.map((episode: Episode) => (
                <Card key={episode.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handlePlayEpisode(episode)}
                      className={`w-12 h-12 rounded-lg shrink-0 ${
                        currentEpisode?.id === episode.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      {currentEpisode?.id === episode.id && currentEpisode?.isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate mb-1">{episode.title}</h3>
                      {episode.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {episode.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(episode.duration_seconds)}
                        </span>
                        {episode.pub_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(episode.pub_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Audio Player */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background">
        <AudioPlayer />
      </div>
    </div>
  );
};

export default PublicPodcastDetail;