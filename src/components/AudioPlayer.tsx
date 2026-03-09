import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

const AudioPlayer: React.FC = () => {
  const {
    currentEpisode,
    episodeList,
    currentIndex,
    pauseEpisode,
    resumeEpisode,
    updateProgress,
    setCurrentEpisode,
    playPreviousEpisode,
    playNextEpisode,
  } = useAudioPlayer();

  const canGoNext = Boolean(episodeList?.length && currentIndex >= 0 && currentIndex < episodeList.length - 1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      updateProgress(audio.currentTime);
    };

    const handleEnded = () => {
      if (!currentEpisode) return;
      if (canGoNext) {
        playNextEpisode();
      } else {
        setCurrentEpisode({
          ...currentEpisode,
          isPlaying: false,
          currentTime: audio.duration || (currentEpisode.duration || 0),
        });
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentEpisode, updateProgress, setCurrentEpisode, canGoNext, playNextEpisode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    if (currentEpisode.isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [currentEpisode?.isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      updateProgress(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 5);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const replay5 = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - 5);
    }
  };

  const fastForward5 = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.min(duration, audio.currentTime + 5);
    }
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(playbackRate);
    setPlaybackRate(SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]);
  };

  const canGoPrevious = episodeList.length > 0 && currentIndex > 0;
  const canGoNext = episodeList.length > 0 && currentIndex >= 0 && currentIndex < episodeList.length - 1;

  if (!currentEpisode) return null;

  return (
    <Card className="mt-4 border-t-0 rounded-t-lg shadow-lg bg-card/95 backdrop-blur-sm">
      <div className="p-4">
        <audio ref={audioRef} src={currentEpisode.audioUrl} preload="metadata" />

        <div className="flex items-center gap-4">
          {/* Episode Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{currentEpisode.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{currentEpisode.podcastTitle}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={replay5}
              className="h-8 w-8 relative"
            >
              <RotateCcw className="!h-6 !w-6" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">5</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={playPreviousEpisode}
              className="h-8 w-8"
              disabled={!canGoPrevious}
              title={canGoPrevious ? "Previous episode" : "No previous episode"}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={currentEpisode.isPlaying ? pauseEpisode : resumeEpisode}
              className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {currentEpisode.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>     
            <Button
              variant="ghost"
              size="icon"
              onClick={playNextEpisode}
              className="h-8 w-8"
              disabled={!canGoNext}
              title={canGoNext ? "Next episode" : "No next episode"}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
               <Button
              variant="ghost"
              size="icon"
              onClick={fastForward5}
              className="h-8 w-8 relative"
            >
                <RotateCw className="!h-6 !w-6" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">5</span>
            
            </Button>
          </div>
          <div className="flex-1 max-w-md flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {formatTime(currentEpisode.currentTime)}
            </span>
            <Slider
              value={[Math.min(currentEpisode.currentTime, Math.max(1, duration || currentEpisode.duration || 1))]}
              max={Math.max(1, duration || currentEpisode.duration || 1)}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1 cursor-pointer"
            />
            <span className="text-xs text-muted-foreground w-10 tabular-nums">
              {formatTime(duration || currentEpisode.duration || 0)}
            </span>
          </div>

          {/* Playback speed (RSS.com-style) */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs font-medium min-w-[3rem]"
            onClick={cycleSpeed}
            title="Playback speed"
          >
            {playbackRate}x
          </Button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentEpisode(null)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AudioPlayer;