import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { CreatorProfile, SocialLinks, HighlightMetric } from '@/types/creator-profile';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, 
  Mail, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  Rss,
  ExternalLink,
  Sparkles
} from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialIcons: Record<keyof SocialLinks, React.ComponentType<{ className?: string }>> = {
  website: Globe,
  email: Mail,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  tiktok: TikTokIcon,
  linkedin: Linkedin,
  podcastRss: Rss,
};

const socialLabels: Record<keyof SocialLinks, string> = {
  website: 'Website',
  email: 'Email',
  twitter: 'Twitter',
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  podcastRss: 'Podcast RSS',
};

export default function CreatorPublicPage() {
  const { handle } = useParams<{ handle: string }>();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['creator-profile', handle],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('handle', handle)
        .eq('is_public', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        social_links: (data.social_links || {}) as unknown as SocialLinks,
        highlight_metrics: (data.highlight_metrics || []) as unknown as HighlightMetric[],
        featured_project_ids: data.featured_project_ids || [],
      } as CreatorProfile;
    },
    enabled: !!handle,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-64 bg-muted animate-pulse" />
        <div className="max-w-4xl mx-auto px-4 -mt-20">
          <div className="flex flex-col items-center text-center">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-8 w-48 mt-4" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Helmet>
          <title>Creator Not Found | Alchify</title>
        </Helmet>
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Creator Not Found</h1>
            <p className="text-muted-foreground">
              This creator page doesn't exist or is currently private.
            </p>
            <Button className="mt-6" asChild>
              <a href="/">Go to Alchify</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const primaryCTA = profile.social_links.podcastRss 
    ? { label: 'Listen to my podcast', url: profile.social_links.podcastRss }
    : profile.social_links.website 
    ? { label: 'Visit my site', url: profile.social_links.website }
    : null;

  const activeSocialLinks = Object.entries(profile.social_links)
    .filter(([_, value]) => value)
    .map(([key, value]) => ({ key: key as keyof SocialLinks, value: value as string }));

  const getSocialUrl = (key: keyof SocialLinks, value: string): string => {
    if (key === 'email') return `mailto:${value}`;
    if (value.startsWith('http')) return value;
    return `https://${value}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{profile.display_name} | Alchify</title>
        <meta name="description" content={profile.tagline || profile.bio?.slice(0, 160) || `${profile.display_name}'s Alchify Page`} />
      </Helmet>

      {/* Hero Section */}
      <div 
        className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-accent/20"
        style={profile.hero_image_url ? {
          backgroundImage: `url(${profile.hero_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10 pb-12">
        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center mb-8">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            {profile.avatar_url ? (
              <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            ) : (
              <AvatarFallback className="text-3xl bg-primary text-primary-foreground">
                {profile.display_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{profile.display_name}</h1>
          <p className="text-muted-foreground">@{profile.handle}</p>
          
          {profile.tagline && (
            <p className="text-lg text-foreground/80 mt-2 max-w-xl">{profile.tagline}</p>
          )}

          {primaryCTA && (
            <Button className="mt-4" asChild>
              <a href={primaryCTA.url} target="_blank" rel="noopener noreferrer">
                {primaryCTA.label}
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          )}
        </div>

        {/* Social Links */}
        {activeSocialLinks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {activeSocialLinks.map(({ key, value }) => {
              const Icon = socialIcons[key];
              return (
                <Button
                  key={key}
                  variant="outline"
                  size="icon"
                  asChild
                  className="h-10 w-10"
                >
                  <a 
                    href={getSocialUrl(key, value)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    title={socialLabels[key]}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                </Button>
              );
            })}
          </div>
        )}

        {/* Highlight Metrics */}
        {profile.highlight_metrics.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {profile.highlight_metrics.map((metric, index) => (
              <Badge key={index} variant="secondary" className="text-sm py-1.5 px-3">
                <span className="font-semibold mr-1">{metric.value}</span>
                {metric.label}
              </Badge>
            ))}
          </div>
        )}

        {/* About Section */}
        {profile.bio && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/80 whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Powered by Alchify
          </a>
        </div>
      </div>
    </div>
  );
}
