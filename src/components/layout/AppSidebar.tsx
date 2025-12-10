import { useState, useEffect, useMemo, useCallback } from 'react';
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
  Shield,
  Users,
  FileText,
  TrendingUp,
  Server,
  Library,
  Presentation,
  Contact,
  User,
  Calculator,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Layers,
  Settings2
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

// Icon map for dynamic icon rendering
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
  Shield,
  Users,
  FileText,
  TrendingUp,
  Server,
  Library,
  Presentation,
  Contact,
  User,
  Calculator,
  ClipboardList,
  Layers,
  Settings2,
};

// Nav item type
interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

// Nav section type
interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

// Creator nav sections
const creatorSections: NavSection[] = [
  {
    id: 'home',
    label: 'Home',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
    ],
  },
  {
    id: 'create',
    label: 'Create',
    items: [
      { id: 'studio', label: 'Recording Studio', icon: 'Video', path: '/studio' },
      { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
    ],
  },
  {
    id: 'library',
    label: 'Library',
    items: [
      { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
      { id: 'media-library', label: 'Media Library', icon: 'Library', path: '/library' },
    ],
  },
  {
    id: 'refine',
    label: 'Refine & Publish',
    items: [
      { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
      { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
    ],
  },
  {
    id: 'grow',
    label: 'Grow & Profile',
    items: [
      { id: 'alchify-page', label: 'Alchify Page', icon: 'User', path: '/creator/profile' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
];

// Admin nav sections
const adminSections: NavSection[] = [
  {
    id: 'admin-core',
    label: 'Admin',
    items: [
      { id: 'admin-dashboard', label: 'Admin Dashboard', icon: 'Shield', path: '/admin' },
    ],
  },
  {
    id: 'people',
    label: 'People & Accounts',
    items: [
      { id: 'admin-users', label: 'Manage Users', icon: 'Users', path: '/admin/users' },
      { id: 'admin-contacts', label: 'Contacts', icon: 'Contact', path: '/admin/contacts' },
    ],
  },
  {
    id: 'content',
    label: 'Content & Data',
    items: [
      { id: 'admin-content', label: 'Content', icon: 'FileText', path: '/admin/content' },
      { id: 'admin-analytics', label: 'Analytics', icon: 'TrendingUp', path: '/admin/analytics' },
    ],
  },
  {
    id: 'tasks',
    label: 'Tasks & Workflow',
    items: [
      { id: 'admin-tasks', label: 'Tasks', icon: 'ClipboardList', path: '/admin/tasks' },
    ],
  },
  {
    id: 'system',
    label: 'System & Strategy',
    items: [
      { id: 'admin-tech', label: 'Tech Stack', icon: 'Server', path: '/admin/tech-stack' },
      { id: 'admin-vto', label: 'CEO VTO', icon: 'Presentation', path: '/admin/ceo-vto' },
      { id: 'admin-cfo', label: 'CFO Dashboard', icon: 'Calculator', path: '/admin/cfo-dashboard' },
    ],
  },
];

type NavMode = 'creator' | 'admin';

const STORAGE_KEY = 'alchify-sidebar-state';

interface SidebarState {
  mode: NavMode;
  openCreatorGroupId: string | null;
  adminExpanded: boolean;
}

// Find which creator section contains a given path
const findCreatorSectionForPath = (path: string): string | null => {
  for (const section of creatorSections) {
    for (const item of section.items) {
      if (path === item.path || (item.path !== '/' && path.startsWith(item.path))) {
        return section.id;
      }
    }
  }
  return null;
};

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin } = useAdminCheck();

  // Load persisted state from localStorage
  const loadStoredState = (): SidebarState => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load sidebar state:', e);
    }
    return { mode: 'creator', openCreatorGroupId: null, adminExpanded: false };
  };

  const [sidebarState, setSidebarState] = useState<SidebarState>(loadStoredState);

  // Persist state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sidebarState));
    } catch (e) {
      console.error('Failed to save sidebar state:', e);
    }
  }, [sidebarState]);

  // Sync mode with route changes
  useEffect(() => {
    const isAdminRoute = location.pathname.startsWith('/admin');
    const currentMode = isAdminRoute ? 'admin' : 'creator';
    
    setSidebarState(prev => {
      if (currentMode !== prev.mode) {
        if (currentMode === 'admin') {
          // Switching to admin: collapse creator, expand admin
          return {
            ...prev,
            mode: 'admin',
            adminExpanded: true,
          };
        } else {
          // Switching to creator: find and expand the relevant section
          const sectionId = findCreatorSectionForPath(location.pathname);
          return {
            ...prev,
            mode: 'creator',
            openCreatorGroupId: sectionId || prev.openCreatorGroupId,
            adminExpanded: false,
          };
        }
      } else if (currentMode === 'creator') {
        // Already in creator mode, update open section if navigating
        const sectionId = findCreatorSectionForPath(location.pathname);
        if (sectionId && sectionId !== prev.openCreatorGroupId) {
          return {
            ...prev,
            openCreatorGroupId: sectionId,
          };
        }
      }
      return prev;
    });
  }, [location.pathname]);

  // Toggle admin section expansion
  const handleAdminToggle = useCallback(() => {
    if (!sidebarState.adminExpanded) {
      // Expanding admin: collapse all creator groups
      setSidebarState(prev => ({
        ...prev,
        adminExpanded: true,
        openCreatorGroupId: null,
      }));
    } else {
      // Collapsing admin
      setSidebarState(prev => ({
        ...prev,
        adminExpanded: false,
      }));
    }
  }, [sidebarState.adminExpanded]);

  // Handle clicking a creator section
  const handleCreatorSectionClick = useCallback((sectionId: string) => {
    setSidebarState(prev => ({
      ...prev,
      openCreatorGroupId: prev.openCreatorGroupId === sectionId ? null : sectionId,
      adminExpanded: false, // Collapse admin when interacting with creator sections
    }));
  }, []);

  // Handle clicking a creator nav item
  const handleCreatorItemClick = useCallback((sectionId: string) => {
    setSidebarState(prev => ({
      ...prev,
      mode: 'creator',
      openCreatorGroupId: sectionId,
      adminExpanded: false,
    }));
  }, []);

  // Check if a path is active
  const isActive = useCallback((path: string) => {
    if (path === '/refiner') {
      return location.pathname.startsWith('/refiner');
    }
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    if (path.startsWith('/admin/')) {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  }, [location.pathname]);

  // Render a nav item - tighter spacing
  const renderNavItem = (item: NavItem, sectionId: string, isAdminItem = false) => {
    const Icon = iconMap[item.icon];
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.path)}
          tooltip={item.label}
          className="py-1 h-7 text-[13px]"
        >
          <Link 
            to={item.path} 
            data-ui-element={item.id}
            onClick={() => !isAdminItem && handleCreatorItemClick(sectionId)}
          >
            {Icon && <Icon className={cn('h-3.5 w-3.5', isAdminItem && 'text-primary')} />}
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // Render a collapsible creator section - tighter spacing
  const renderCreatorSection = (section: NavSection) => {
    const isOpen = sidebarState.openCreatorGroupId === section.id;
    
    if (collapsed) {
      return (
        <SidebarGroup key={section.id} className="py-px">
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {section.items.map((item) => renderNavItem(item, section.id, false))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup key={section.id} className="py-px">
        <Collapsible open={isOpen} onOpenChange={() => handleCreatorSectionClick(section.id)}>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel 
              className="text-[9px] uppercase tracking-wider cursor-pointer flex items-center justify-between hover:text-foreground transition-colors py-0.5 text-muted-foreground"
            >
              <span>{section.label}</span>
              {isOpen ? (
                <ChevronDown className="h-2.5 w-2.5" />
              ) : (
                <ChevronRight className="h-2.5 w-2.5" />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              <SidebarMenu className="gap-px">
                {section.items.map((item) => renderNavItem(item, section.id, false))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  // Render admin section - tighter spacing
  const renderAdminSection = (section: NavSection) => {
    if (collapsed) {
      return (
        <SidebarGroup key={section.id} className="py-px">
          <SidebarGroupContent>
            <SidebarMenu className="gap-px">
              {section.items.map((item) => renderNavItem(item, section.id, true))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup key={section.id} className="py-px">
        <SidebarGroupLabel 
          className="text-[9px] uppercase tracking-wider py-0.5 text-primary/70"
        >
          {section.label}
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu className="gap-px">
            {section.items.map((item) => renderNavItem(item, section.id, true))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  };

  // Render the Admin & Settings toggle - tighter spacing
  const renderAdminToggle = () => {
    if (!isAdmin) return null;

    if (collapsed) {
      return (
        <SidebarGroup className="py-px">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Admin & Settings" className="py-1 h-7">
                  <Link to="/admin">
                    <Settings2 className="h-3.5 w-3.5 text-primary" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup className="py-px">
        <Collapsible open={sidebarState.adminExpanded} onOpenChange={handleAdminToggle}>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel 
              className="text-[9px] uppercase tracking-wider cursor-pointer flex items-center justify-between hover:text-foreground transition-colors py-1 px-1.5 rounded-sm text-primary/70 bg-primary/5"
            >
              <span className="flex items-center gap-1.5">
                <Settings2 className="h-2.5 w-2.5" />
                Admin & Settings
              </span>
              {sidebarState.adminExpanded ? (
                <ChevronDown className="h-2.5 w-2.5" />
              ) : (
                <ChevronRight className="h-2.5 w-2.5" />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-0.5 space-y-px">
              {adminSections.map((section) => renderAdminSection(section))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  // Render Creator View toggle (shown in admin mode) - tighter spacing
  const renderCreatorViewToggle = () => {
    const hasOpenCreatorGroup = sidebarState.openCreatorGroupId !== null;

    if (collapsed) {
      return (
        <SidebarGroup className="py-px">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Creator View" className="py-1 h-7">
                  <Link to="/dashboard">
                    <Layers className="h-3.5 w-3.5" />
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup className="py-px">
        <Collapsible 
          open={hasOpenCreatorGroup} 
          onOpenChange={() => {
            if (hasOpenCreatorGroup) {
              setSidebarState(prev => ({ ...prev, openCreatorGroupId: null }));
            } else {
              setSidebarState(prev => ({ ...prev, openCreatorGroupId: 'home' }));
            }
          }}
        >
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel 
              className="text-[9px] uppercase tracking-wider cursor-pointer flex items-center justify-between hover:text-foreground transition-colors py-1 px-1.5 rounded-sm text-muted-foreground bg-muted/50"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="h-2.5 w-2.5" />
                Creator View
              </span>
              {hasOpenCreatorGroup ? (
                <ChevronDown className="h-2.5 w-2.5" />
              ) : (
                <ChevronRight className="h-2.5 w-2.5" />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-0.5 space-y-px">
              {creatorSections.map((section) => renderCreatorSection(section))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  // Determine what to render based on current mode
  const isAdminMode = sidebarState.mode === 'admin' || location.pathname.startsWith('/admin');

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-2.5">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold gradient-text">Alchify</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-1">
        {isAdminMode && isAdmin ? (
          <>
            {/* Admin mode: Show admin sections expanded */}
            {adminSections.map((section) => renderAdminSection(section))}
            
            {/* Collapsed Creator View toggle */}
            <div className="my-1 mx-0.5 h-px bg-border" />
            {renderCreatorViewToggle()}
          </>
        ) : (
          <>
            {/* Creator mode: Show creator sections */}
            {creatorSections.map((section) => renderCreatorSection(section))}
            
            {/* Admin toggle - only for admins */}
            {isAdmin && (
              <>
                <div className="my-1 mx-0.5 h-px bg-border" />
                {renderAdminToggle()}
              </>
            )}
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-1.5">
        {!collapsed && (
          <div className="text-[9px] text-muted-foreground text-center">
            The Crucible for Creators
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
