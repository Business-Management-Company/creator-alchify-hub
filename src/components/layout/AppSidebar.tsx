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

// All admin paths for mode detection
const ADMIN_PATHS = ['/admin', '/admin/'];

type NavMode = 'creator' | 'admin';

const STORAGE_KEY = 'alchify-nav-state';

interface StoredNavState {
  expandedGroups: string[];
}

const AppSidebar = () => {
  const location = useLocation();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { isAdmin } = useAdminCheck();

  // Determine nav mode based on current route
  const navMode: NavMode = useMemo(() => {
    return location.pathname.startsWith('/admin') ? 'admin' : 'creator';
  }, [location.pathname]);

  // Load persisted expanded groups from localStorage
  const loadStoredState = (): StoredNavState => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load nav state:', e);
    }
    return { expandedGroups: [] };
  };

  // Initialize expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const stored = loadStoredState();
    return new Set(stored.expandedGroups);
  });

  // Track if user manually collapsed the mode toggle
  const [creatorViewExpanded, setCreatorViewExpanded] = useState(false);
  const [adminViewExpanded, setAdminViewExpanded] = useState(false);

  // Persist expanded groups to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        expandedGroups: Array.from(expandedGroups),
      }));
    } catch (e) {
      console.error('Failed to save nav state:', e);
    }
  }, [expandedGroups]);

  // Reset view expansions when mode changes
  useEffect(() => {
    if (navMode === 'admin') {
      setCreatorViewExpanded(false);
    } else {
      setAdminViewExpanded(false);
    }
  }, [navMode]);

  // Toggle a specific section
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
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

  // Render a nav item
  const renderNavItem = (item: NavItem, isAdminItem = false) => {
    const Icon = iconMap[item.icon];
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          asChild
          isActive={isActive(item.path)}
          tooltip={item.label}
          className="py-1.5"
        >
          <Link to={item.path} data-ui-element={item.id}>
            {Icon && <Icon className={cn('h-4 w-4', isAdminItem && 'text-primary')} />}
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  // Render a collapsible section
  const renderSection = (section: NavSection, isAdminSection = false, forceOpen = false) => {
    const isOpen = forceOpen || expandedGroups.has(section.id);
    
    if (collapsed) {
      // In collapsed mode, just show icons
      return (
        <SidebarGroup key={section.id} className="py-0.5">
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {section.items.map((item) => renderNavItem(item, isAdminSection))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup key={section.id} className="py-0.5">
        <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel 
              className={cn(
                'text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-between hover:text-foreground transition-colors py-1',
                isAdminSection ? 'text-primary/70' : 'text-muted-foreground'
              )}
            >
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
              <SidebarMenu className="gap-0.5">
                {section.items.map((item) => renderNavItem(item, isAdminSection))}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  // Render collapsed mode toggle (Creator View or Admin & Settings)
  const renderModeToggle = (
    label: string,
    icon: React.ReactNode,
    isExpanded: boolean,
    onToggle: () => void,
    sections: NavSection[],
    isAdminSection: boolean
  ) => {
    if (collapsed) {
      // In collapsed sidebar, show a single icon that links to the first item
      const firstItem = sections[0]?.items[0];
      if (!firstItem) return null;
      const Icon = iconMap[firstItem.icon];
      return (
        <SidebarGroup className="py-0.5">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={label} className="py-1.5">
                  <Link to={firstItem.path}>
                    {Icon && <Icon className={cn('h-4 w-4', isAdminSection && 'text-primary')} />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      );
    }

    return (
      <SidebarGroup className="py-0.5">
        <Collapsible open={isExpanded} onOpenChange={onToggle}>
          <CollapsibleTrigger className="w-full">
            <SidebarGroupLabel 
              className={cn(
                'text-[10px] uppercase tracking-wider cursor-pointer flex items-center justify-between hover:text-foreground transition-colors py-1.5 px-2 rounded-md',
                isAdminSection ? 'text-primary/70 bg-primary/5' : 'text-muted-foreground bg-muted/50'
              )}
            >
              <span className="flex items-center gap-2">
                {icon}
                {label}
              </span>
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-1 space-y-0.5">
              {sections.map((section) => renderSection(section, isAdminSection, true))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="relative flex-shrink-0">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold gradient-text">Alchify</span>
          )}
        </Link>
      </SidebarHeader>
      
      <SidebarContent className="px-1.5">
        {navMode === 'admin' && isAdmin ? (
          <>
            {/* Admin mode: Show admin sections first */}
            {adminSections.map((section) => renderSection(section, true, true))}
            
            {/* Collapsed Creator View toggle */}
            <div className="my-2 mx-1 h-px bg-border" />
            {renderModeToggle(
              'Creator View',
              <Layers className="h-3 w-3" />,
              creatorViewExpanded,
              () => setCreatorViewExpanded(!creatorViewExpanded),
              creatorSections,
              false
            )}
          </>
        ) : (
          <>
            {/* Creator mode: Show creator sections first */}
            {creatorSections.map((section) => renderSection(section, false, true))}
            
            {/* Admin toggle - only for admins */}
            {isAdmin && (
              <>
                <div className="my-2 mx-1 h-px bg-border" />
                {renderModeToggle(
                  'Admin & Settings',
                  <Settings2 className="h-3 w-3" />,
                  adminViewExpanded,
                  () => setAdminViewExpanded(!adminViewExpanded),
                  adminSections,
                  true
                )}
              </>
            )}
          </>
        )}
      </SidebarContent>
      
      <SidebarFooter className="p-2">
        {!collapsed && (
          <div className="text-[10px] text-muted-foreground text-center">
            The Crucible for Creators
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
