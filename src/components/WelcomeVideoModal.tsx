import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface WelcomeVideoModalProps {
  delay?: number; // Delay in milliseconds before showing
  videoPath?: string; // Path to video in welcome-videos bucket
}

export function WelcomeVideoModal({ 
  delay = 5000, 
  videoPath = 'welcome.mp4' 
}: WelcomeVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    return localStorage.getItem('alchify_seen_welcome_video') === 'true';
  });

  // Fetch video URL from storage
  useEffect(() => {
    const fetchVideoUrl = async () => {
      const { data } = supabase.storage
        .from('welcome-videos')
        .getPublicUrl(videoPath);
      
      if (data?.publicUrl) {
        setVideoUrl(data.publicUrl);
      }
    };

    if (!hasSeenWelcome) {
      fetchVideoUrl();
    }
  }, [videoPath, hasSeenWelcome]);

  // Show modal after delay
  useEffect(() => {
    if (hasSeenWelcome || !videoUrl) return;

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, hasSeenWelcome, videoUrl]);

  const handleClose = () => {
    setIsOpen(false);
    setHasSeenWelcome(true);
    localStorage.setItem('alchify_seen_welcome_video', 'true');
  };

  // Don't render if already seen or no video
  if (hasSeenWelcome) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="absolute top-3 right-3 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            <X className="h-4 w-4" />
          </Button>

          {/* Mute toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-3 right-3 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {/* Video */}
          {videoUrl ? (
            <video
              src={videoUrl}
              autoPlay
              muted={isMuted}
              playsInline
              className="w-full aspect-video object-cover"
              onEnded={handleClose}
            />
          ) : (
            <div className="w-full aspect-video bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Loading video...</p>
            </div>
          )}
        </div>

        {/* Optional CTA section */}
        <div className="p-4 bg-card border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Welcome to Alchify</h3>
              <p className="text-sm text-muted-foreground">
                Transform your raw content into polished, platform-ready assets
              </p>
            </div>
            <Button onClick={handleClose}>Get Started</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}