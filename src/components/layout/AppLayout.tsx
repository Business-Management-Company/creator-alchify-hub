import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import RefinerAIPanel from '@/components/ai/RefinerAIPanel';
import { GlobalAudioProvider } from '@/contexts/GlobalAudioContext';
import GlobalAudioBar from '@/components/GlobalAudioBar';

interface AppLayoutProps {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}

const AppLayout = ({ children, defaultSidebarOpen = true }: AppLayoutProps) => {
  return (
    <GlobalAudioProvider>
      <SidebarProvider defaultOpen={defaultSidebarOpen}>
        <div className="app-theme min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <AppHeader />
            <main className="flex-1 p-3 overflow-auto pb-24">
              {children}
            </main>
          </div>
          <RefinerAIPanel />
          <GlobalAudioBar />
        </div>
      </SidebarProvider>
    </GlobalAudioProvider>
  );
};

export default AppLayout;
