import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mic, Music, Rss, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import podcastStudio from "@/assets/podcast-studio.jpg";
import { ImportRSSButton } from "@/components/podcast/ImportRSSButton";
import AppLayout from "@/components/layout/AppLayout";
import { usePodcasts } from "@/hooks/usePodcasts";
import { useQueryClient } from "@tanstack/react-query";

const Podcasts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: podcasts, isLoading } = usePodcasts();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-600 border-green-200";
      case "draft": return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "archived": return "bg-gray-500/10 text-gray-600 border-gray-200";
      default: return "";
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Mic className="w-8 h-8 text-primary" /> Podcasts
              </h1>
              <p className="text-muted-foreground mt-1">Manage your podcast shows, episodes, and RSS feeds</p>
            </div>
            <div className="flex gap-3">
              <Button size="lg" variant="outline" className="text-base font-semibold border-2" onClick={() => navigate("/podcasts/create")}>
                <Plus className="w-5 h-5 mr-2" /> Add New Podcast
              </Button>
              <ImportRSSButton onImportComplete={(podcastId) => { queryClient.invalidateQueries({ queryKey: ["podcasts"] }); navigate(`/podcasts/${podcastId}`); }} />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (<Card key={i} className="h-64 animate-pulse bg-muted/20" />))}
            </div>
          ) : podcasts && podcasts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {podcasts.map((podcast) => (
                <Card key={podcast.id} className="overflow-hidden hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group" onClick={() => navigate(`/podcasts/${podcast.id}`)}>
                  {podcast.image_url ? (
                    <img src={podcast.image_url} alt={podcast.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Music className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg line-clamp-1 flex-1">{podcast.title}</h3>
                      <Badge variant="outline" className={`text-xs shrink-0 ${getStatusColor(podcast.status)}`}>{podcast.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{podcast.description || "No description yet"}</p>
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      {podcast.category && <span className="px-2 py-0.5 rounded-full bg-muted">{podcast.category}</span>}
                      {podcast.language && <span className="px-2 py-0.5 rounded-full bg-muted uppercase">{podcast.language}</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="overflow-hidden">
              <img src={podcastStudio} alt="Professional podcast studio" className="w-full h-64 object-cover" />
              <div className="p-12 text-center">
                <h3 className="text-2xl font-bold mb-2">No podcasts yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">Create your first podcast on Alchify</p>
                <Button size="lg" onClick={() => navigate("/podcasts/create")}><Plus className="w-4 h-4 mr-2" /> Create Your First Podcast</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Podcasts;
