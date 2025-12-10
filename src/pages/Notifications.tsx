import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, CheckCheck, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import AppLayout from '@/components/layout/AppLayout';

export default function Notifications() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'task_updated':
        return '✏️';
      case 'task_commented':
        return '💬';
      case 'task_due_soon':
        return '⏰';
      case 'system_update':
        return '📢';
      default:
        return '🔔';
    }
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.task_id) {
      navigate(`/admin/tasks/${notification.task_id}`);
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const date = new Date(notification.created_at);
    let label = format(date, 'MMMM d, yyyy');
    
    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else if (isThisWeek(date)) {
      label = 'This Week';
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);

  return (
    <>
      <Helmet>
        <title>Notifications | Alchify</title>
      </Helmet>
      
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Notifications</h1>
                <p className="text-muted-foreground">All your recent updates in one place</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="p-4 rounded-full bg-muted/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">You're all caught up!</p>
                <p className="text-sm text-muted-foreground/70 mt-1">No new notifications</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{dateLabel}</h3>
                  <Card>
                    <CardContent className="p-0 divide-y divide-border">
                      {items.map((notification, index) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors',
                            !notification.is_read && 'bg-muted/30'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-sm', !notification.is_read && 'font-medium')}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                markRead.mutate(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
