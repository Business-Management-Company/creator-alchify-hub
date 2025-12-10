import { useState, useEffect } from 'react';
import { Settings, LogOut, User, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AppHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
          setDisplayName(data.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User');
        } else {
          setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'User');
          setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || 'User');
      }
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been successfully signed out.',
    });
    navigate('/');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: 'Search',
        description: `Searching for "${searchQuery}"...`,
      });
      // Future: implement actual search
    }
  };

  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-4 gap-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        
        {/* Master Site Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 h-9 bg-background/50 border-border focus:bg-background"
            />
          </div>
        </form>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9">
          <Search className="h-4 w-4" />
        </Button>
        
        {/* Notification Bell */}
        <NotificationBell />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-border">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-9 w-9 border-2 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default AppHeader;
