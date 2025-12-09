import { ReactNode } from 'react';
import AppSidebar from './AppSidebar';
import AppHeader from './AppHeader';
import { SidebarProvider } from '@/components/ui/sidebar';

interface AppLayoutProps {
  children: ReactNode;
  defaultSidebarOpen?: boolean;
}

const AppLayout = ({ children, defaultSidebarOpen = true }: AppLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen}>
      <div className="app-theme min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-4 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
