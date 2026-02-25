import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Check, Globe, Radio, Music2, Headphones, Podcast } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Platform {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  submitUrl: string;
  description: string;
  steps: string[];
}

const PLATFORMS: Platform[] = [
  {
    id: "spotify",
    name: "Spotify",
    icon: <Music2 className="w-5 h-5" />,
    color: "bg-green-500/10 text-green-600 border-green-200",
    submitUrl: "https://podcasters.spotify.com/",
    description: "The world's largest audio streaming platform with 600M+ users.",
    steps: [
      "Go to Spotify for Podcasters and sign in or create an account",
      "Click 'Add your podcast' and paste your RSS feed URL",
      "Verify ownership via email",
      "Wait 24-48 hours for review and approval",
      "Once live, copy your Spotify podcast URL below",
    ],
  },
  {
    id: "apple",
    name: "Apple Podcasts",
    icon: <Podcast className="w-5 h-5" />,
    color: "bg-purple-500/10 text-purple-600 border-purple-200",
    submitUrl: "https://podcastsconnect.apple.com/",
    description: "Reach iOS, macOS, and Apple device listeners worldwide.",
    steps: [
      "Sign in to Apple Podcasts Connect with your Apple ID",
      "Click the '+' button and paste your RSS feed URL",
      "Review your podcast details and submit",
      "Wait 1-5 days for Apple's review",
      "Once approved, copy your Apple Podcasts URL below",
    ],
  },
  {
    id: "youtube_music",
    name: "YouTube Music",
    icon: <Headphones className="w-5 h-5" />,
    color: "bg-red-500/10 text-red-600 border-red-200",
    submitUrl: "https://music.youtube.com/podcasts/",
    description: "Distribute via YouTube's music and podcast platform.",
    steps: [
      "Go to YouTube Studio and sign in",
      "Navigate to Settings → Channel → Advanced → Podcast RSS feed",
      "Paste your RSS feed URL and submit",
      "Wait for YouTube to process your feed",
      "Once live, copy your YouTube Music podcast URL below",
    ],
  },
  {
    id: "amazon",
    name: "Amazon Music",
    icon: <Radio className="w-5 h-5" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-200",
    submitUrl: "https://podcasters.amazon.com/",
    description: "Available on Amazon Music, Audible, and Alexa devices.",
    steps: [
      "Go to Amazon Music for Podcasters and sign in",
      "Click 'Add a podcast' and paste your RSS feed URL",
      "Verify your email and podcast ownership",
      "Wait for Amazon's review process",
      "Once live, copy your Amazon Music podcast URL below",
    ],
  },
  {
    id: "other",
    name: "Other Platforms",
    icon: <Globe className="w-5 h-5" />,
    color: "bg-muted text-muted-foreground border-border",
    submitUrl: "",
    description: "Submit to Pocket Casts, Overcast, Castro, iHeartRadio, etc.",
    steps: [
      "Most platforms accept RSS feeds — just find their submission page",
      "Paste your RSS feed URL",
      "Complete their verification process",
      "Add the live URL below once approved",
    ],
  },
];

interface Distribution {
  id: string;
  platform: string;
  status: string;
  submitted_at: string | null;
  live_url: string | null;
  notes: string | null;
}

interface DistributionHubProps {
  podcastId: string;
  rssFeedUrl: string;
  isImported: boolean;
}

export default function DistributionHub({ podcastId, rssFeedUrl, isImported }: DistributionHubProps) {
  const { user } = useAuth();
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [liveUrls, setLiveUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchDistributions();
  }, [podcastId]);

  const fetchDistributions = async () => {
    const { data, error } = await (supabase as any)
      .from("podcast_distributions")
      .select("*")
      .eq("podcast_id", podcastId);
    if (!error && data) {
      setDistributions(data);
      const urls: Record<string, string> = {};
      data.forEach((d: Distribution) => {
        if (d.live_url) urls[d.platform] = d.live_url;
      });
      setLiveUrls(urls);
    }
    setLoading(false);
  };

  const getDistribution = (platformId: string) =>
    distributions.find((d) => d.platform === platformId);

  const handleMarkSubmitted = async (platformId: string) => {
    if (!user) return;
    const existing = getDistribution(platformId);
    if (existing) {
      await (supabase as any)
        .from("podcast_distributions")
        .update({ status: "submitted", submitted_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("podcast_distributions")
        .insert({
          podcast_id: podcastId,
          user_id: user.id,
          platform: platformId,
          status: "submitted",
          submitted_at: new Date().toISOString(),
        });
    }
    toast.success(`Marked as submitted to ${PLATFORMS.find((p) => p.id === platformId)?.name}`);
    fetchDistributions();
  };

  const handleSaveLiveUrl = async (platformId: string) => {
    if (!user) return;
    const url = liveUrls[platformId];
    if (!url) return;
    const existing = getDistribution(platformId);
    if (existing) {
      await (supabase as any)
        .from("podcast_distributions")
        .update({ status: "live", live_url: url })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("podcast_distributions")
        .insert({
          podcast_id: podcastId,
          user_id: user.id,
          platform: platformId,
          status: "live",
          live_url: url,
          submitted_at: new Date().toISOString(),
        });
    }
    toast.success(`${PLATFORMS.find((p) => p.id === platformId)?.name} marked as live!`);
    fetchDistributions();
  };

  const getStatusBadge = (dist: Distribution | undefined) => {
    if (!dist) return <Badge variant="outline" className="text-xs">Not submitted</Badge>;
    switch (dist.status) {
      case "submitted":
        return <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200">Submitted</Badge>;
      case "live":
        return <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">Live</Badge>;
      case "rejected":
        return <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Not submitted</Badge>;
    }
  };

  if (isImported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-4 h-4" /> Distribution
          </CardTitle>
          <CardDescription>
            This podcast was imported via RSS and is likely already distributed on streaming platforms.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* RSS Feed URL Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Radio className="w-4 h-4" /> Your RSS Feed URL
          </CardTitle>
          <CardDescription>
            Copy this URL and submit it to streaming platforms below. New episodes you add will automatically appear in the feed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input readOnly value={rssFeedUrl} className="text-xs font-mono" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(rssFeedUrl);
                toast.success("RSS feed URL copied!");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div className="space-y-3">
        {PLATFORMS.map((platform) => {
          const dist = getDistribution(platform.id);
          const isExpanded = expandedPlatform === platform.id;

          return (
            <Card key={platform.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${platform.color}`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{platform.name}</h3>
                    <p className="text-xs text-muted-foreground">{platform.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(dist)}
                  {dist?.status === "live" && dist.live_url && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(dist.live_url!, "_blank");
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
                  {/* Steps */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">How to submit:</h4>
                    <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                      {platform.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3">
                    {platform.submitUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(platform.submitUrl, "_blank")}
                        className="w-fit"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open {platform.name}
                      </Button>
                    )}

                    {(!dist || dist.status === "not_submitted") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkSubmitted(platform.id)}
                        className="w-fit"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        I've submitted my RSS feed
                      </Button>
                    )}

                    {/* Live URL input */}
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder={`Paste your ${platform.name} podcast URL once live...`}
                        value={liveUrls[platform.id] || ""}
                        onChange={(e) =>
                          setLiveUrls((prev) => ({ ...prev, [platform.id]: e.target.value }))
                        }
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        disabled={!liveUrls[platform.id]}
                        onClick={() => handleSaveLiveUrl(platform.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
