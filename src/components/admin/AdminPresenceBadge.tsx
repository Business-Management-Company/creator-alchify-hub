import { useState } from 'react';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAdminPresence, AdminPresence } from '@/hooks/useAdminPresence';
import { cn } from '@/lib/utils';

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function AdminListItem({ admin }: { admin: AdminPresence }) {
  const initials = getInitials(admin.display_name);
  
  return (
    <div className="flex items-center gap-3 py-2">
      <Avatar className="h-8 w-8 border border-border">
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">
            {admin.display_name || 'Admin'}
          </span>
          {admin.is_self && (
            <span className="text-xs text-muted-foreground">(You)</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge 
            variant={admin.is_idle ? 'secondary' : 'default'}
            className={cn(
              "text-[10px] px-1.5 py-0 h-4",
              !admin.is_idle && "bg-green-500/20 text-green-600 hover:bg-green-500/20"
            )}
          >
            {admin.is_idle ? 'Idle' : 'Active now'}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {admin.current_section}
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminPresenceBadge() {
  const { activeAdmins, activeCount, loading, error, isInAdminArea } = useAdminPresence();
  const [open, setOpen] = useState(false);

  // Don't show if not in admin area or still loading admin check
  if (!isInAdminArea) {
    return null;
  }

  // Show placeholder while loading
  if (loading) {
    return (
      <Button variant="ghost" size="sm" className="h-10 px-2 gap-2" disabled>
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">—</span>
      </Button>
    );
  }

  // Handle error state gracefully
  if (error) {
    return (
      <Button variant="ghost" size="sm" className="h-10 px-2 gap-2" disabled>
        <Users className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">—</span>
      </Button>
    );
  }

  const displayCount = activeCount > 0 ? activeCount : 1;
  const hasOthers = activeAdmins.filter(a => !a.is_self && !a.is_idle).length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn(
            "h-10 px-2 gap-2",
            hasOthers && "bg-primary/10 hover:bg-primary/20"
          )}
        >
          <Users className={cn(
            "h-5 w-5",
            hasOthers ? "text-primary" : "text-muted-foreground"
          )} />
          <span className={cn(
            "text-sm",
            hasOthers ? "text-primary font-medium" : "text-muted-foreground"
          )}>
            {displayCount}
          </span>
          {/* Stacked avatars for first 3 admins */}
          {activeAdmins.length > 0 && (
            <div className="flex -space-x-2 ml-1">
              {activeAdmins.slice(0, 3).map((admin, i) => (
                <Avatar 
                  key={admin.id} 
                  className="h-6 w-6 border border-background"
                  style={{ zIndex: 3 - i }}
                >
                  <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-medium">
                    {getInitials(admin.display_name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-72 p-0"
      >
        <div className="p-3 border-b border-border">
          <h4 className="text-sm font-semibold">Currently in Admin</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCount} admin{activeCount !== 1 ? 's' : ''} active
          </p>
        </div>
        <div className="p-2 max-h-64 overflow-y-auto">
          {activeAdmins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No admins online
            </p>
          ) : (
            activeAdmins.map(admin => (
              <AdminListItem key={admin.id} admin={admin} />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
