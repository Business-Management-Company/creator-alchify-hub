import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function GlobalAudioBar() {
  const {
    currentTrack, isPlaying, currentTime, duration,
    volume, isMuted, playbackRate,
    togglePlay, seek, setVolume, toggleMute, cycleSpeed, skip, close,
  } = useGlobalAudio();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm shadow-lg">
      {/* Progress bar across top */}
      <div className="px-4 pt-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={(v) => seek(v[0])}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-1">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-card-foreground">{currentTrack.title}</p>
          {currentTrack.podcastTitle && (
            <p className="text-xs text-muted-foreground truncate">{currentTrack.podcastTitle}</p>
          )}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(-10)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="default" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlay}>
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => skip(10)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed + Volume + Close */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs font-mono min-w-[3rem]" onClick={cycleSpeed}>
            {playbackRate}x
          </Button>

          <div className="hidden sm:flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={(v) => setVolume(v[0])}
              className="w-20 cursor-pointer"
            />
          </div>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={close}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
