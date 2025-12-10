import { useState, useEffect, useMemo } from 'react';
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
  Server,
  Library,
  Presentation,
  Contact,
  User,
  Calculator,
  ChevronDown,
  ChevronRight,
  ClipboardList
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Library,
  Presentation,
  Contact,
  User,
  Calculator,
  ClipboardList,
};

type NavSection = {
  label: string;
  items: { id: string; label: string; icon: string; path: string }[];
};

const creatorSections: NavSection[] = [
  {
    label: 'Home',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    ],
  },
  {
    label: 'Create',
    items: [
      { id: 'studio', label: 'Recording Studio', icon: 'Video', path: '/studio' },
      { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
    ],
  },
  {
    label: 'Library',
    items: [
      { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
      { id: 'library', label: 'Media Library', icon: 'Library', path: '/library' },
    ],
  },
  {
    label: 'Refine & Publish',
    items: [
      { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
      { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
    ],
  },
  {
    label: 'Grow & Profile',
    items: [
      { id: 'alchify-page', label: 'Alchify Page', icon: 'User', path: '/creator/profile' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
];

const adminSections: NavSection[] = [
  {
    label: 'Admin',
    items: [
      { id: 'admin', label: 'Admin Dashboard', icon: 'Shield', path: '/admin' },
    ],
  },
  {
    label: 'People & Accounts',
    items: [
      { id: 'admin-users', label: 'Manage Users', icon: 'Users', path: '/admin/users' },
      { id: 'admin-contacts', label: 'Contacts', icon: 'Contact', path: '/admin/contacts' },
    ],
  },
  {
    label: 'Content & Data',
    items: [
      { id: 'admin-content', label: 'Content', icon: 'FileText', path: '/admin/content' },
      { id: 'admin-analytics', label: 'Analytics', icon: 'TrendingUp', path: '/admin/analytics' },
    ],
  },
  {
    label: 'Tasks & Workflow',
    items: [
      { id: 'admin-tasks', label: 'Tasks', icon: 'ClipboardList', path: '/admin/tasks' },
    ],
  },
  {
    label: 'System & Strategy',
    items: [
      { id: 'admin-tech', label: 'Tech Stack', icon: 'Server', path: '/admin/tech-stack' },
      { id: 'admin-vto', label: 'CEO VTO', icon: 'Presentation', path: '/admin/ceo-vto' },
      { id: 'admin-cfo', label: 'CFO Dashboard', icon: 'Calculator', path: '/admin/cfo-dashboard' },
    ],
  },
];

const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin } = useAdminCheck();

  // Find section containing the current route
  const findSectionForPath = useMemo(() => {
    const allSections = [...creatorSections, ...adminSections];
    for (const section of allSections) {
      for (const item of section.items) {
        if (location.pathname === item.path || 
            (item.path === '/refiner' && location.pathname.startsWith('/refiner')) ||
            (item.path === '/admin' && location.pathname === '/admin') ||
            (item.path !== '/admin' && location.pathname.startsWith(item.path))) {
          return section.label;
        }
      }
    }
    return null;
  }, [location.pathname]);

  // Initialize sections - expand creator sections, admin sections collapsed by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    creatorSections.forEach(s => { initial[s.label] = true; });
    adminSections.forEach(s => { initial[s.label] = false; });
    return initial;
  });

  // Auto-expand section containing active route when navigating
  useEffect(() => {
    if (findSectionForPath) {
      const isAdminSection = adminSections.some(s => s.label === findSectionForPath);
      
      setOpenSections(prev => {
        const newState = { ...prev, [findSectionForPath]: true };
        
        // If navigating to admin section, collapse creator sections
        if (isAdminSection) {
          creatorSections.forEach(s => {
            newState[s.label] = false;
          });
        }
        
        return newState;
      });
    }
  }, [findSectionForPath]);

  const toggleSection = (label: string, isAdminSection: boolean) => {
    setOpenSections(prev => {
      const newState = { ...prev, [label]: !prev[label] };
      
      // If opening an admin section, collapse all creator sections
      if (isAdminSection && !prev[label]) {
        creatorSections.forEach(s => {
          newState[s.label] = false;
        });
      }
      
      return newState;
    });
  };

  const isActive = (path: string) => {
    if (path === '/refiner') {
      return location.pathname.startsWith('/refiner');
    }
    if (path === '/admin') {
      return location.pathname.startsWith('/admin');
    }
    return location.pathname === path;
  };

  const renderSection = (section: NavSection, isAdminSection = false) => {
    const isOpen = openSections[section.label] ?? true;
    
    return (
      <SidebarGroup key={section.label}>
        {!collapsed ? (
          <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.label, isAdminSection)}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className={`text-xs uppercase tracking-wide cursor-pointer flex items-center justify-between hover:text-foreground transition-colors ${isAdminSection ? 'text-primary/70' : 'text-muted-foreground'}`}>
                <span>{section.label}</span>
                {isOpen ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {section.items.map((item) => {
                    const Icon = iconMap[item.icon];
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.path)}
                          tooltip={item.label}
                        >
                          <Link to={item.path} data-ui-element={item.id}>
                            {Icon && <Icon className={`h-4 w-4 ${isAdminSection ? 'text-primary' : ''}`} />}
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        ) : (
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path} data-ui-element={item.id}>
                        {Icon && <Icon className={`h-4 w-4 ${isAdminSection ? 'text-primary' : ''}`} />}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        )}
      </SidebarGroup>
    );
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
        {creatorSections.map((section) => renderSection(section, false))}
        
        {/* Admin Sections - Only visible to admins */}
        {isAdmin && (
          <>
            <div className="my-4 mx-2 h-px bg-border" />
            {adminSections.map((section) => renderSection(section, true))}
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
