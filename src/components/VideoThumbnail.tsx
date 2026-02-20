import { useState, useEffect, useRef } from 'react';
import { Video, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AudioPlayer } from '@/components/ui/audio-player';

interface VideoThumbnailProps {
  sourceFileUrl: string | null;
  sourceFileType: string | null;
  className?: string;
  showControls?: boolean;
}

export const VideoThumbnail = ({ 
  sourceFileUrl, 
  sourceFileType, 
  className = '',
  showControls = true 
}: VideoThumbnailProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      if (!sourceFileUrl) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase.storage
          .from('media-uploads')
          .createSignedUrl(sourceFileUrl, 3600);

        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error getting signed URL:', error);
      } finally {
        setLoading(false);
      }
    };

    getSignedUrl();
  }, [sourceFileUrl]);

  const handleLoadedMetadata = () => {
    // Seek to 0.5 seconds to show a thumbnail frame
    if (videoRef.current) {
      videoRef.current.currentTime = 0.5;
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center text-muted-foreground">
          <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No preview available</p>
        </div>
      </div>
    );
  }

  if (sourceFileType === 'audio') {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <div className="text-center">
          <div className="p-4 rounded-full bg-primary/10 mx-auto mb-2 w-fit">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">Audio file</p>
          {showControls && (
            <AudioPlayer src={signedUrl} compact className="mt-4 w-full max-w-md" />
          )}
        </div>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      src={signedUrl}
      controls={showControls}
      preload="metadata"
      className={`object-contain bg-black ${className}`}
      onLoadedMetadata={handleLoadedMetadata}
    />
  );
};

export default VideoThumbnail;
