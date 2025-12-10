import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreatorProfile, CreatorProfileFormData, SocialLinks, HighlightMetric } from '@/types/creator-profile';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Globe, 
  Mail, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin,
  Rss,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Eye,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const socialFields: { key: keyof SocialLinks; label: string; icon: React.ComponentType<{ className?: string }>; placeholder: string }[] = [
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yoursite.com' },
  { key: 'email', label: 'Email', icon: Mail, placeholder: 'you@example.com' },
  { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: 'https://twitter.com/username' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
  { key: 'tiktok', label: 'TikTok', icon: TikTokIcon, placeholder: 'https://tiktok.com/@username' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
  { key: 'podcastRss', label: 'Podcast RSS', icon: Rss, placeholder: 'https://feed.example.com/podcast.rss' },
];

const defaultFormData: CreatorProfileFormData = {
  handle: '',
  display_name: '',
  tagline: '',
  bio: '',
  avatar_url: '',
  hero_image_url: '',
  primary_color: '',
  accent_color: '',
  social_links: {},
  highlight_metrics: [],
  is_public: true,
};

export default function CreatorProfileEditor() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CreatorProfileFormData>(defaultFormData);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    if (!user) return;
    
    const isAvatar = type === 'avatar';
    const setUploading = isAvatar ? setUploadingAvatar : setUploadingCover;
    const maxSize = isAvatar ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB for avatar, 5MB for cover
    
    if (file.size > maxSize) {
      toast.error(`File too large. Max size: ${isAvatar ? '2MB' : '5MB'}`);
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('creator-assets')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('creator-assets')
        .getPublicUrl(fileName);
      
      setFormData(prev => ({
        ...prev,
        [isAvatar ? 'avatar_url' : 'hero_image_url']: publicUrl,
      }));
      
      toast.success(`${isAvatar ? 'Avatar' : 'Cover image'} uploaded!`);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch existing profile
  const { data: existingProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-creator-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
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
    enabled: !!user,
  });

  // Initialize form with existing data
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        handle: existingProfile.handle,
        display_name: existingProfile.display_name,
        tagline: existingProfile.tagline || '',
        bio: existingProfile.bio || '',
        avatar_url: existingProfile.avatar_url || '',
        hero_image_url: existingProfile.hero_image_url || '',
        primary_color: existingProfile.primary_color || '',
        accent_color: existingProfile.accent_color || '',
        social_links: existingProfile.social_links,
        highlight_metrics: existingProfile.highlight_metrics,
        is_public: existingProfile.is_public,
      });
      setHandleAvailable(true);
    }
  }, [existingProfile]);

  // Check handle availability
  const checkHandle = async (handle: string) => {
    if (!handle || handle.length < 2) {
      setHandleAvailable(null);
      return;
    }

    // Validate format
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(handle) && !/^[a-z0-9]$/.test(handle)) {
      setHandleAvailable(false);
      return;
    }

    setCheckingHandle(true);
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('id')
        .eq('handle', handle)
        .maybeSingle();

      if (error) throw error;
      
      // Available if no profile found, or if it's the user's own profile
      setHandleAvailable(!data || data.id === existingProfile?.id);
    } catch (err) {
      console.error('Error checking handle:', err);
      setHandleAvailable(null);
    } finally {
      setCheckingHandle(false);
    }
  };

  // Debounced handle check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.handle !== existingProfile?.handle) {
        checkHandle(formData.handle.toLowerCase());
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.handle, existingProfile?.handle]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: CreatorProfileFormData) => {
      if (!user) throw new Error('Not authenticated');

      const profileData = {
        user_id: user.id,
        handle: data.handle.toLowerCase(),
        display_name: data.display_name,
        tagline: data.tagline || null,
        bio: data.bio || null,
        avatar_url: data.avatar_url || null,
        hero_image_url: data.hero_image_url || null,
        primary_color: data.primary_color || null,
        accent_color: data.accent_color || null,
        social_links: JSON.parse(JSON.stringify(data.social_links)),
        highlight_metrics: JSON.parse(JSON.stringify(data.highlight_metrics)),
        is_public: data.is_public,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('creator_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('creator_profiles')
          .insert(profileData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Profile saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-creator-profile'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });

  const handleSocialLinkChange = (key: keyof SocialLinks, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [key]: value || null },
    }));
  };

  const addHighlightMetric = () => {
    if (formData.highlight_metrics.length >= 3) return;
    setFormData(prev => ({
      ...prev,
      highlight_metrics: [...prev.highlight_metrics, { key: '', label: '', value: '' }],
    }));
  };

  const updateHighlightMetric = (index: number, field: keyof HighlightMetric, value: string) => {
    setFormData(prev => ({
      ...prev,
      highlight_metrics: prev.highlight_metrics.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const removeHighlightMetric = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlight_metrics: prev.highlight_metrics.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.handle || !formData.display_name) {
      toast.error('Handle and display name are required');
      return;
    }
    if (handleAvailable === false) {
      toast.error('Please choose an available handle');
      return;
    }
    saveMutation.mutate(formData);
  };

  if (authLoading || profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Your Alchify Page</h1>
            <p className="text-muted-foreground">Customize your public creator profile</p>
          </div>
          {existingProfile && (
            <Button variant="outline" asChild>
              <a href={`/c/${existingProfile.handle}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                View Public Page
              </a>
            </Button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Basics */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Basics</CardTitle>
              <CardDescription>Your public identity on Alchify</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="Johnny Rocket"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                    <Input
                      id="handle"
                      className="pl-8 pr-10"
                      value={formData.handle}
                      onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      placeholder="johnny-rocket"
                    />
                    {formData.handle && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingHandle ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : handleAvailable === true ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : handleAvailable === false ? (
                          <X className="h-4 w-4 text-destructive" />
                        ) : null}
                      </span>
                    )}
                  </div>
                  {formData.handle && handleAvailable === false && (
                    <p className="text-sm text-destructive">This handle is not available or invalid</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                  placeholder="Turning raw footage into polished gold."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell the world about yourself..."
                  rows={4}
                  maxLength={800}
                />
                <p className="text-xs text-muted-foreground">{formData.bio.length}/800 characters</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Avatar</Label>
                  <div className="flex items-center gap-3">
                    {formData.avatar_url ? (
                      <img 
                        src={formData.avatar_url} 
                        alt="Avatar preview" 
                        className="h-16 w-16 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted/50 transition-colors">
                          {uploadingAvatar ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          <span className="text-sm">{uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'avatar');
                          }}
                          disabled={uploadingAvatar}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">Max 2MB</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="space-y-2">
                    {formData.hero_image_url ? (
                      <img 
                        src={formData.hero_image_url} 
                        alt="Cover preview" 
                        className="h-20 w-full rounded-md object-cover border"
                      />
                    ) : (
                      <div className="h-20 w-full rounded-md bg-muted flex items-center justify-center border">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="cursor-pointer block">
                      <div className="flex items-center justify-center gap-2 px-3 py-2 border rounded-md hover:bg-muted/50 transition-colors">
                        {uploadingCover ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        <span className="text-sm">{uploadingCover ? 'Uploading...' : 'Upload Cover'}</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, 'cover');
                        }}
                        disabled={uploadingCover}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">Recommended: 1500 × 500 px (3:1 ratio) • Max 5MB</p>
                    <p className="text-xs text-muted-foreground">Max 5MB</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect your audience to your other platforms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {socialFields.map(({ key, label, icon: Icon, placeholder }) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {label}
                    </Label>
                    <Input
                      id={key}
                      type={key === 'email' ? 'email' : 'url'}
                      value={formData.social_links[key] || ''}
                      onChange={(e) => handleSocialLinkChange(key, e.target.value)}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Highlight Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Highlight Metrics</CardTitle>
              <CardDescription>Show off your achievements (up to 3)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.highlight_metrics.map((metric, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 grid gap-3 md:grid-cols-2">
                    <Input
                      value={metric.label}
                      onChange={(e) => updateHighlightMetric(index, 'label', e.target.value)}
                      placeholder="Label (e.g., Episodes)"
                    />
                    <Input
                      value={metric.value}
                      onChange={(e) => updateHighlightMetric(index, 'value', e.target.value)}
                      placeholder="Value (e.g., 127)"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeHighlightMetric(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.highlight_metrics.length < 3 && (
                <Button type="button" variant="outline" onClick={addHighlightMetric}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control who can see your Alchify Page</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_public 
                      ? 'Your profile is visible at /c/' + (formData.handle || 'your-handle')
                      : 'Your profile is hidden from the public'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_public: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            {existingProfile && (
              <Button type="button" variant="outline" asChild>
                <a href={`/c/${existingProfile.handle}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Public Page
                </a>
              </Button>
            )}
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
