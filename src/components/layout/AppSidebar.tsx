import { 
  LayoutDashboard, 
  Upload, 
  FolderOpen, 
  Wand2, 
  Download,
  Plug,
  BarChart3,
  Settings,
  Sparkles,
  Video,
  Clapperboard,
  Shield,
  Users,
  FileText,
  TrendingUp,
  CreditCard,
  Server
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAdminCheck } from '@/hooks/useAdminCheck';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Upload,
  FolderOpen,
  Wand2,
  Download,
  Plug,
  BarChart3,
  Settings,
  Video,
  Clapperboard,
  Shield,
  Users,
  FileText,
  TrendingUp,
  CreditCard,
  Server,
};

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
  { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
  { id: 'studio', label: 'Recording Studio', icon: 'Video', path: '/studio' },
  { id: 'post-production', label: 'Post Production', icon: 'Clapperboard', path: '/post-production' },
  { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
  { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
];

const secondaryItems = [
  { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
  { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
  { id: 'pricing', label: 'Plans & Pricing', icon: 'CreditCard', path: '/pricing' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
];

const adminItems = [
  { id: 'admin', label: 'Admin Dashboard', icon: 'Shield', path: '/admin' },
  { id: 'admin-users', label: 'Manage Users', icon: 'Users', path: '/admin/users' },
  { id: 'admin-content', label: 'Content', icon: 'FileText', path: '/admin/content' },
  { id: 'admin-analytics', label: 'Analytics', icon: 'TrendingUp', path: '/admin/analytics' },
  { id: 'admin-tech', label: 'Tech Stack', icon: 'Server', path: '/admin/tech-stack' },
];

const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin } = useAdminCheck();

  const isActive = (path: string) => {
    if (path === '/refiner') {
      return location.pathname.startsWith('/refiner');
    }
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === path;
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">Alchify</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="my-4 mx-2 h-px bg-border" />
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path}>
                        {Icon && <Icon className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Admin Section - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-4 mx-2 h-px bg-border" />
            
            <SidebarGroup>
              {!collapsed && (
                <SidebarGroupLabel className="text-xs text-primary/70">Admin</SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminItems.map((item) => {
                    const Icon = iconMap[item.icon];
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.path)}
                          tooltip={item.label}
                        >
                          <Link to={item.path}>
                            {Icon && <Icon className="h-4 w-4 text-primary" />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            The Crucible for Creators
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
