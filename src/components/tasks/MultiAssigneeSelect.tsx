import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check, X, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface MultiAssigneeSelectProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function MultiAssigneeSelect({ selectedIds, onChange, disabled }: MultiAssigneeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['profiles-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url')
        .order('display_name');
      if (error) throw error;
      return data as Profile[];
    },
  });

  const filteredUsers = users.filter(u => 
    (u.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedUsers = users.filter(u => selectedIds.includes(u.user_id));

  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className="w-full justify-start h-auto min-h-10 py-2"
        >
          {selectedUsers.length === 0 ? (
            <span className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Select assignees...
            </span>
          ) : (
            <div className="flex flex-wrap gap-1">
              {selectedUsers.slice(0, 3).map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 text-xs"
                >
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {(user.display_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[80px] truncate">{user.display_name || 'User'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleUser(user.user_id);
                    }}
                    className="hover:bg-muted-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedUsers.length > 3 && (
                <span className="text-xs text-muted-foreground px-1">
                  +{selectedUsers.length - 3} more
                </span>
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div className="max-h-48 overflow-y-auto p-1">
          {filteredUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedIds.includes(user.user_id);
              return (
                <button
                  key={user.user_id}
                  type="button"
                  onClick={() => toggleUser(user.user_id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted",
                    isSelected && "bg-primary/10"
                  )}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(user.display_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-left truncate">{user.display_name || 'Unknown'}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact cell display for the table
export function AssigneesCell({ assignees }: { assignees: { profile?: { user_id: string; display_name: string | null; avatar_url: string | null } | null }[] }) {
  if (!assignees?.length) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <div className="flex items-center -space-x-1.5">
      {assignees.slice(0, 3).map((a, i) => (
        <Avatar 
          key={a.profile?.user_id || i} 
          className="h-6 w-6 border-2 border-background"
          title={a.profile?.display_name || 'User'}
        >
          <AvatarImage src={a.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs bg-muted">
            {(a.profile?.display_name || 'U')[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ))}
      {assignees.length > 3 && (
        <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
          +{assignees.length - 3}
        </div>
      )}
    </div>
  );
}
