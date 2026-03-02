import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import AudioPlayer from '@/components/AudioPlayer';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import RefinerAIPanel from '@/components/ai/RefinerAIPanel';

interface AppLayoutProps {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}

const AppLayout = ({ children, defaultSidebarOpen = true }: AppLayoutProps) => {
  const { currentEpisode } = useAudioPlayer();
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, ''); 

  const parts = pathname.split('/');

  const routePodcastId = parts[1] === 'podcasts' && parts.length >= 3 ? parts[2] : undefined;
  const routePodcastSlug = parts[1] === 'podcast' && parts.length >= 3 ? parts[2] : undefined;

  const showAudioPlayer = (() => {
    if (!currentEpisode) return false;
    if (routePodcastId && currentEpisode.podcastId) {
      return routePodcastId === currentEpisode.podcastId;
    }
    if (routePodcastSlug && currentEpisode.podcastSlug) {
      return routePodcastSlug === currentEpisode.podcastSlug;
    }
    return false;
  })();

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="app-theme min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 flex flex-col p-3 overflow-auto pb-24">
            <div className="flex-1">
              {children}
            </div>
          </main>
        </div>
        <RefinerAIPanel />
        {/* Global audio player: fixed to bottom, always visible while playing */}
        {showAudioPlayer && (
          <div className="fixed bottom-0 left-0 right-0 z-50">
            <AudioPlayer />
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
