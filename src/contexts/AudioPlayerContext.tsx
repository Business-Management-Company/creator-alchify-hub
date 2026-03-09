import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

/** One item in the playlist (same shape as playEpisode input, for next/prev) */
export type PlaylistEpisodeItem = Omit<PlayingEpisode, 'currentTime' | 'isPlaying'>;

export interface PlayEpisodeOptions {
  /** Ordered list of episodes for next/previous. Include resolved audioUrl for each. */
  episodeList?: PlaylistEpisodeItem[];
  /** Index of the episode being played in episodeList (0-based). */
  currentIndex?: number;
}

interface AudioPlayerContextType {
  currentEpisode: PlayingEpisode | null;
  /** Ordered playlist for next/prev; may be empty if not started from a list. */
  episodeList: PlaylistEpisodeItem[];
  /** Index of current episode in episodeList; -1 if not from list. */
  currentIndex: number;
  setCurrentEpisode: (episode: PlayingEpisode | null) => void;
  playEpisode: (episode: PlaylistEpisodeItem, options?: PlayEpisodeOptions) => void;
  /** Play the previous episode in episodeList, if any. */
  playPreviousEpisode: () => void;
  /** Play the next episode in episodeList, if any. */
  playNextEpisode: () => void;
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
  const [episodeList, setEpisodeList] = useState<PlaylistEpisodeItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const playEpisode = useCallback((episode: PlaylistEpisodeItem, options?: PlayEpisodeOptions) => {
    const list = options?.episodeList ?? [];
    const index = options?.currentIndex ?? (list.length ? list.findIndex((e) => e.id === episode.id) : -1);
    setEpisodeList(list);
    setCurrentIndex(index >= 0 ? index : -1);
    setCurrentEpisode({
      ...episode,
      currentTime: 0,
      isPlaying: true,
    });
  }, []);

  const playPreviousEpisode = useCallback(() => {
    if (episodeList.length === 0 || currentIndex <= 0) return;
    const prev = episodeList[currentIndex - 1];
    if (prev) {
      setCurrentIndex(currentIndex - 1);
      setCurrentEpisode({
        ...prev,
        currentTime: 0,
        isPlaying: true,
      });
    }
  }, [episodeList, currentIndex]);

  const playNextEpisode = useCallback(() => {
    if (episodeList.length === 0 || currentIndex < 0 || currentIndex >= episodeList.length - 1) return;
    const next = episodeList[currentIndex + 1];
    if (next) {
      setCurrentIndex(currentIndex + 1);
      setCurrentEpisode({
        ...next,
        currentTime: 0,
        isPlaying: true,
      });
    }
  }, [episodeList, currentIndex]);

  const pauseEpisode = useCallback(() => {
    if (currentEpisode) {
      setCurrentEpisode({
        ...currentEpisode,
        isPlaying: false,
      });
    }
  }, [currentEpisode]);

  const resumeEpisode = useCallback(() => {
    if (currentEpisode) {
      setCurrentEpisode({
        ...currentEpisode,
        isPlaying: true,
      });
    }
  }, [currentEpisode]);

  const updateProgress = useCallback((time: number) => {
    if (currentEpisode) {
      setCurrentEpisode({
        ...currentEpisode,
        currentTime: time,
      });
    }
  }, [currentEpisode]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentEpisode,
        episodeList,
        currentIndex,
        setCurrentEpisode,
        playEpisode,
        playPreviousEpisode,
        playNextEpisode,
        pauseEpisode,
        resumeEpisode,
        updateProgress,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};