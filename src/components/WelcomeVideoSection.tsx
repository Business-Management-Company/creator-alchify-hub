import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import thumbnailImage from '@/assets/welcome-video-thumbnail.png';

interface WelcomeVideoSectionProps {
  videoPath?: string;
}

export function WelcomeVideoSection({ videoPath = 'Alchify_ Content Gold.mp4' }: WelcomeVideoSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch video URL from storage
  useEffect(() => {
    const { data } = supabase.storage
      .from('welcome-videos')
      .getPublicUrl(videoPath);
    
    if (data?.publicUrl) {
      setVideoUrl(data.publicUrl);
    }
  }, [videoPath]);

  const handlePlayClick = () => {
    if (videoError) {
      // If video failed, don't try to play
      return;
    }
    
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error('Video play error:', err);
        setVideoError(true);
      });
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handlePauseClick = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-card/50">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Video Container */}
          <div 
            className="relative rounded-2xl overflow-hidden bg-card border border-border shadow-2xl group cursor-pointer"
            onClick={!isPlaying ? handlePlayClick : undefined}
          >
            {/* Thumbnail - Always show until video is playing */}
            {!isPlaying && (
              <img
                src={thumbnailImage}
                alt="Watch how Alchify works"
                className="w-full aspect-video object-cover"
              />
            )}

            {/* Video Element - Hidden until playing */}
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                muted={isMuted}
                playsInline
                preload="metadata"
                className={`w-full aspect-video object-cover ${isPlaying ? 'block' : 'hidden'}`}
                onEnded={handleVideoEnd}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onCanPlay={() => setVideoLoaded(true)}
                onError={() => setVideoError(true)}
              />
            )}

            {/* Play Button Overlay - Shows when not playing */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 transition-all">
                {videoError ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Video unavailable</p>
                  </div>
                ) : (
                  <button
                    onClick={handlePlayClick}
                    className="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform glow-primary"
                  >
                    <Play className="h-8 w-8 text-primary-foreground ml-1" fill="currentColor" />
                  </button>
                )}
                
                {/* Label */}
                {!videoError && (
                  <div className="absolute bottom-6 left-6">
                    <p className="text-lg font-semibold text-white drop-shadow-lg">Watch: How Alchify Works</p>
                    <p className="text-sm text-white/80 drop-shadow-lg">See the magic in 60 seconds</p>
                  </div>
                )}
              </div>
            )}

            {/* Video Controls - Shows when playing */}
            {isPlaying && (
              <div 
                className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePauseClick}
                    className="text-foreground hover:bg-foreground/20"
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-foreground hover:bg-foreground/20"
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                  
                  <div className="flex-1" />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreen}
                    className="text-foreground hover:bg-foreground/20"
                  >
                    <Maximize className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Decorative glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-xl -z-10 opacity-50" />
          </div>
        </div>
      </div>
    </section>
  );
}