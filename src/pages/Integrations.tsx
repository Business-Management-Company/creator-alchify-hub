import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plug, 
  Youtube, 
  Instagram, 
  Facebook, 
  Twitter,
  HardDrive,
  Cloud,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const integrations = [
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Publish videos and shorts directly to your YouTube channel.',
    icon: Youtube,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    connected: false,
    category: 'social',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Share reels and posts to your Instagram account.',
    icon: Instagram,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    connected: false,
    category: 'social',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Post videos and reels to your Facebook page.',
    icon: Facebook,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    connected: false,
    category: 'social',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'Share clips and updates to your X/Twitter account.',
    icon: Twitter,
    color: 'text-foreground',
    bgColor: 'bg-foreground/10',
    connected: false,
    category: 'social',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Sync and backup your media files to Google Drive.',
    icon: HardDrive,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    connected: false,
    category: 'storage',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Automatically save exports to your Dropbox account.',
    icon: Cloud,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    connected: false,
    category: 'storage',
  },
];

const Integrations = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleConnect = (integrationName: string) => {
    toast({
      title: 'Coming Soon',
      description: `${integrationName} integration will be available soon!`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const socialIntegrations = integrations.filter(i => i.category === 'social');
  const storageIntegrations = integrations.filter(i => i.category === 'storage');

  return (
    <>
      <Helmet>
        <title>Integrations | Alchify</title>
        <meta name="description" content="Connect your social media and cloud storage accounts to Alchify." />
      </Helmet>
      
      <AppLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Plug className="h-8 w-8 text-primary" />
              Integrations
            </h1>
            <p className="text-muted-foreground mt-2">
              Connect your accounts to publish content directly and sync your media files.
            </p>
          </div>

          {/* Social Media */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Social Media</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {socialIntegrations.map((integration) => (
                <Card key={integration.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl ${integration.bgColor} flex items-center justify-center`}>
                        <integration.icon className={`h-6 w-6 ${integration.color}`} />
                      </div>
                      {integration.connected && (
                        <Badge variant="secondary" className="text-green-500">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant={integration.connected ? "outline" : "default"}
                      className="w-full"
                      onClick={() => handleConnect(integration.name)}
                    >
                      {integration.connected ? (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Manage
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cloud Storage */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Cloud Storage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {storageIntegrations.map((integration) => (
                <Card key={integration.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-xl ${integration.bgColor} flex items-center justify-center`}>
                        <integration.icon className={`h-6 w-6 ${integration.color}`} />
                      </div>
                      {integration.connected && (
                        <Badge variant="secondary" className="text-green-500">
                          Connected
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant={integration.connected ? "outline" : "default"}
                      className="w-full"
                      onClick={() => handleConnect(integration.name)}
                    >
                      {integration.connected ? (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Manage
                        </>
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Integrations;
