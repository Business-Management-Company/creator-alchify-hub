import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PlayingEpisode {
  id: string;
  title: string;
  audioUrl: string;
  podcastTitle: string;
  podcastId?: string;
  podcastSlug?: string;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
}

interface AudioPlayerContextType {
  currentEpisode: PlayingEpisode | null;
  setCurrentEpisode: (episode: PlayingEpisode | null) => void;
  playEpisode: (episode: Omit<PlayingEpisode, 'currentTime' | 'isPlaying'>) => void;
  pauseEpisode: () => void;
  resumeEpisode: () => void;
  updateProgress: (currentTime: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

interface AudioPlayerProviderProps {
  children: ReactNode;
}

export const AudioPlayerProvider: React.FC<AudioPlayerProviderProps> = ({ children }) => {
  const [currentEpisode, setCurrentEpisode] = useState<PlayingEpisode | null>(null);

  const playEpisode = (episode: Omit<PlayingEpisode, 'currentTime' | 'isPlaying'>) => {
    setCurrentEpisode({
      ...episode,
      currentTime: 0,
      isPlaying: true,
    });
  };

  const pauseEpisode = () => {
    if (currentEpisode) {
      setCurrentEpisode({
        ...currentEpisode,
        isPlaying: false,
      });
    }
  };

  const resumeEpisode = () => {
    if (currentEpisode) {
      setCurrentEpisode({
        ...currentEpisode,
        isPlaying: true,
      });
    }
  };

  const updateProgress = (currentTime: number) => {
    if (currentEpisode) {
      setCurrentEpisode({
        ...currentEpisode,
        currentTime,
      });
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentEpisode,
        setCurrentEpisode,
        playEpisode,
        pauseEpisode,
        resumeEpisode,
        updateProgress,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};