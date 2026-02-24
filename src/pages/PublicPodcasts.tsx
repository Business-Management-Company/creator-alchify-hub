import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Mic, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PublicPodcasts = () => {
  const navigate = useNavigate();

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["public-podcasts"],
    queryFn: async () => {
      // First get all published podcasts
      const { data: podcastsData, error: podcastsError } = await supabase
        .from("podcasts")
        .select("id, title, description, cover_image_url, category, language, slug, status, author_name")
        .eq("status", "published");

      if (podcastsError) throw podcastsError;

      // Then get episodes for each podcast
      const podcastsWithEpisodes = await Promise.all(
        (podcastsData || []).map(async (podcast) => {
          const { data: episodes, error: episodesError } = await supabase
            .from("episodes")
            .select("id, title, description, audio_url, duration_seconds, publish_date, status, created_at")
            .eq("podcast_id", podcast.id)
            .eq("status", "published")
            .order("publish_date", { ascending: false });

          if (episodesError) {
            console.error("Error fetching episodes for podcast", podcast.id, episodesError);
            return { ...podcast, episodes: [], episodeCount: 0, latestEpisode: null };
          }

          const episodeCount = episodes?.length || 0;
          const latestEpisode = episodes && episodes.length > 0 ? episodes[0] : null;

          return {
            ...podcast,
            episodes: episodes || [],
            episodeCount,
            latestEpisode
          };
        })
      );

      return podcastsWithEpisodes;
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto p-6">
             <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Mic className="w-8 h-8 text-primary" />
                Podcasts
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover and listen to amazing podcasts
              </p>
            </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
       <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Mic className="w-8 h-8 text-primary" />
                Podcasts
              </h1>
              <p className="text-muted-foreground mt-1">
                Discover and listen to amazing podcasts
              </p>
            </div>

        {/* Podcasts Grid */}
        {podcasts && podcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => (
              <Card
                key={podcast.id}
                className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group"
                onClick={() => navigate(`/podcast/${podcast.slug}`)}
              >
                {podcast.cover_image_url ? (
                  <img
                    src={podcast.cover_image_url}
                    alt={podcast.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Music className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {podcast.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {podcast.description || "No description available"}
                  </p>

                  {/* Podcast Info */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{podcast.episodeCount} episodes</span>
                    {podcast.category && (
                      <Badge variant="outline" className="text-xs">
                        {podcast.category}
                      </Badge>
                    )}
                  </div>

                  {/* Latest Episode Info */}
                  {podcast.latestEpisode && (
                    <div className="border-t pt-3">
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                        {podcast.latestEpisode.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(podcast.latestEpisode.duration_seconds)}
                        </span>
                        {podcast.latestEpisode.publish_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(podcast.latestEpisode.publish_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Author */}
                  {podcast.author_name && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      by {podcast.author_name}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No podcasts available</h3>
            <p className="text-muted-foreground">Check back later for new content.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicPodcasts;