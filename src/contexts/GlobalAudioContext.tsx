import { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';

interface Track {
  src: string;
  title: string;
  podcastTitle?: string;
  artwork?: string;
}

interface GlobalAudioContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  play: (track: Track) => void;
  togglePlay: () => void;
  pause: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleSpeed: () => void;
  skip: (seconds: number) => void;
  close: () => void;
}

const GlobalAudioContext = createContext<GlobalAudioContextType | undefined>(undefined);

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function GlobalAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Create audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    });

    return () => {
      audio.pause();
      audio.src = '';
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, []);

  const play = useCallback((track: Track) => {
    const audio = audioRef.current;
    if (!audio) return;

    // If same track, just resume
    if (currentTrack?.src === track.src) {
      audio.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
      return;
    }

    // New track
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    audio.src = track.src;
    audio.volume = isMuted ? 0 : volume;
    audio.playbackRate = playbackRate;
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);
    audio.play();
    setIsPlaying(true);
    animationRef.current = requestAnimationFrame(updateProgress);
  }, [currentTrack, isMuted, volume, playbackRate, updateProgress]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setIsPlaying(false);
    } else {
      audio.play();
      animationRef.current = requestAnimationFrame(updateProgress);
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying, updateProgress]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      if (audioRef.current) audioRef.current.volume = next ? 0 : volume;
      return next;
    });
  }, [volume]);

  const cycleSpeed = useCallback(() => {
    setPlaybackRate(prev => {
      const idx = SPEED_OPTIONS.indexOf(prev);
      const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds));
    }
  }, []);

  const close = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <GlobalAudioContext.Provider value={{
      currentTrack, isPlaying, currentTime, duration, volume, isMuted, playbackRate,
      play, togglePlay, pause, seek, setVolume, toggleMute, cycleSpeed, skip, close,
    }}>
      {children}
    </GlobalAudioContext.Provider>
  );
}

export function useGlobalAudio() {
  const ctx = useContext(GlobalAudioContext);
  if (!ctx) throw new Error('useGlobalAudio must be used within GlobalAudioProvider');
  return ctx;
}
