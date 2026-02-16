import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Plus, Mic, Music, Download, Rss, Copy, ExternalLink, Mail, Clock, Infinity, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import podcastStudio from "@/assets/podcast-studio.jpg";
import { useState, useMemo } from "react";
import { calculateEpisodeImpressions, calculateRevenue, formatCurrency, formatNumber } from "@/lib/config/revenueModelConfig";
import { EmailVerificationWizard } from "@/components/podcast/EmailVerificationWizard";
import { ImportRSSButton } from "@/components/podcast/ImportRSSButton";
import AppLayout from "@/components/layout/AppLayout";

const Podcasts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState<any>(null);

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["podcasts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      console.log("📊 Fetching podcasts for user:", user.id);
      
      const { data, error } = await (supabase as any)
        .from("podcasts")
        .select(`
          *,
          episodes(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      console.log("📊 Podcasts query result:", { 
        count: data?.length, 
        error,
        podcasts: data?.map((p: any) => ({ id: p.id, title: p.title, user_id: p.user_id }))
      });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate aggregate analytics
  const analyticsData = useMemo(() => {
    if (!podcasts) return null;

    let totalEpisodes = 0;
    let totalAdReads = 0;
    let totalImpressions = 0;
    let totalRevenue = 0;

    const podcastStats = podcasts.map((podcast) => {
      const episodes = (podcast.episodes as any[]) || [];
      const episodeCount = episodes.length;
      
      let podcastAdReads = 0;
      let podcastImpressions = 0;
      
      episodes.forEach((episode: any) => {
        const adReads = episode.ad_reads || [];
        const episodeAge = Math.floor((Date.now() - new Date(episode.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const impressions = calculateEpisodeImpressions(episodeAge, adReads.length);
        
        podcastAdReads += adReads.length;
        podcastImpressions += impressions;
      });

      const revenue = calculateRevenue(podcastImpressions, podcastAdReads);

      totalEpisodes += episodeCount;
      totalAdReads += podcastAdReads;
      totalImpressions += podcastImpressions;
      totalRevenue += revenue;

      return {
        podcastId: podcast.id,
        podcastTitle: podcast.title,
        episodeCount,
        adReadCount: podcastAdReads,
        impressions: podcastImpressions,
        revenue,
      };
    });

    return {
      totalEpisodes,
      totalAdReads,
      totalImpressions,
      totalRevenue,
      podcastStats,
    };
  }, [podcasts]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Mic className="w-8 h-8 text-primary" />
              Podcasts
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your podcast shows, episodes, and RSS feeds
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              size="lg"
              variant="outline"
              className="text-base font-semibold border-2"
              onClick={() => navigate("/podcasts/create")}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add New Podcast
            </Button>
            <ImportRSSButton 
              onImportComplete={(podcastId) => {
                console.log("Import complete, podcast ID:", podcastId);
                queryClient.invalidateQueries({ queryKey: ["podcasts"] });
                // Navigate directly to the podcast's RSS Migration tab
                navigate(`/podcasts/${podcastId}`);
              }} 
            />
          </div>
        </div>

        {/* Podcast Analytics Overview */}
        {analyticsData && analyticsData.totalEpisodes > 0 && (
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Podcast Analytics & Revenue
              </CardTitle>
              <CardDescription>
                Performance metrics and estimated revenue across all your podcasts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Total Episodes</div>
                  <div className="text-2xl font-bold">{analyticsData.totalEpisodes}</div>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="text-sm text-muted-foreground mb-1">Total Ad Reads</div>
                  <div className="text-2xl font-bold">{analyticsData.totalAdReads}</div>
                </div>
                <div className="p-4 rounded-lg bg-background border border-border">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Impressions
                  </div>
                  <div className="text-2xl font-bold">{formatNumber(analyticsData.totalImpressions)}</div>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="text-sm text-green-600 dark:text-green-400 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Est. Revenue
                  </div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(analyticsData.totalRevenue)}
                  </div>
                </div>
              </div>

              {/* Per-Podcast Breakdown */}
              <div className="space-y-3">
                <div className="text-sm font-medium text-muted-foreground mb-2">Revenue by Podcast</div>
                {analyticsData.podcastStats.map((stat) => (
                  <div
                    key={stat.podcastId}
                    className="p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/podcasts/${stat.podcastId}/stats`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{stat.podcastTitle}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {stat.episodeCount} episodes · {stat.adReadCount} ad reads · {formatNumber(stat.impressions)} impressions
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(stat.revenue)}
                        </div>
                        <div className="text-xs text-muted-foreground">estimated</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                <strong>Note:</strong> Revenue calculations based on ${analyticsData ? 25 : 0} CPM with mock impression data. 
                Real-time tracking coming soon.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Podcasts Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-muted/20" />
            ))}
          </div>
        ) : podcasts && podcasts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {podcasts.map((podcast) => {
              const episodes = (podcast.episodes as any[]) || [];
              const episodeCount = episodes.length;
              const hasVerificationEmail = !!podcast.verification_email;
              const isExpired = podcast.verification_email_expires_at && 
                new Date(podcast.verification_email_expires_at) < new Date();
              
              return (
                <Card
                  key={podcast.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/podcasts/${podcast.id}`)}
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
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {podcast.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {podcast.description || "No description"}
                    </p>
                    
                    {/* RSS Feed Section */}
                    <div className="mb-3 space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">RSS Feed for Spotify/Apple</Label>
                      <div 
                        className="flex items-center gap-2 p-2.5 bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rssUrl = `https://taxqcioheqdqtlmjeaht.supabase.co/functions/v1/podcast-rss/${podcast.slug || podcast.id}`;
                          copyToClipboard(rssUrl, "RSS feed");
                        }}
                      >
                        <Rss className="h-4 w-4 text-primary flex-shrink-0" />
                        <code className="text-xs flex-1 truncate text-foreground font-mono">
                          {`https://seeksy.io/rss/${podcast.slug || podcast.id}`}
                        </code>
                        <Copy className="h-3.5 w-3.5 text-primary flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    {/* Email Verification Section */}
                    <div className="mb-3">
                      {hasVerificationEmail && !isExpired ? (
                        <div 
                          className="flex items-center gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-md cursor-pointer hover:bg-yellow-500/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPodcast(podcast);
                            setVerificationDialogOpen(true);
                          }}
                        >
                          <Mail className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                              {podcast.verification_email_permanent ? (
                                <>
                                  <Infinity className="h-3 w-3" />
                                  Email Verified (Permanent)
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3" />
                                  Email Verified (48h)
                                </>
                              )}
                            </div>
                            <div className="text-[10px] text-yellow-600/70 dark:text-yellow-400/70 truncate">
                              {podcast.verification_email}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPodcast(podcast);
                            setVerificationDialogOpen(true);
                          }}
                        >
                          <Mail className="h-3.5 w-3.5 mr-1.5" />
                          Add Email for Spotify Verification
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {episodeCount} episode{episodeCount !== 1 ? 's' : ''}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        podcast.is_published
                          ? 'bg-primary/10 text-primary'
                          : 'bg-secondary/10 text-secondary'
                      }`}>
                        {podcast.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <img 
                src={podcastStudio} 
                alt="Professional podcast studio" 
                className="w-full h-64 object-cover"
              />
              <div className="p-12 text-center">
                <h3 className="text-2xl font-bold mb-2">No podcasts yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first podcast on Alcify and start sharing your voice with the world
                </p>
                <Button size="lg" onClick={() => navigate("/podcasts/create")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Podcast
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Email Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Email Verification</DialogTitle>
            <DialogDescription>
              Manage your podcast verification email for directory submissions
            </DialogDescription>
          </DialogHeader>
          
          {selectedPodcast && (
            <EmailVerificationWizard
              podcastId={selectedPodcast.id}
              podcastSlug={selectedPodcast.slug}
              currentEmail={selectedPodcast.verification_email}
              currentExpiration={selectedPodcast.verification_email_expires_at}
              currentPermanent={selectedPodcast.verification_email_permanent}
              onComplete={() => setVerificationDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AppLayout>
  );
};

export default Podcasts;
