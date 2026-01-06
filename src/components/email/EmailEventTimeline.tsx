import { Mail, CheckCircle, Eye, MousePointer, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEmailEvents } from "@/hooks/useEmailAnalytics";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailEventTimelineProps {
  emailSendId: string;
}

export function EmailEventTimeline({ emailSendId }: EmailEventTimelineProps) {
  const { data: events, isLoading } = useEmailEvents(emailSendId);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "sent":
        return <Mail className="h-4 w-4 text-muted-foreground" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "opened":
        return <Eye className="h-4 w-4 text-blue-500" />;
      case "clicked":
        return <MousePointer className="h-4 w-4 text-purple-500" />;
      case "bounced":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "complained":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "delivery_delayed":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getEventLabel = (type: string) => {
    switch (type) {
      case "sent":
        return "Email sent";
      case "delivered":
        return "Email delivered";
      case "opened":
        return "Email opened";
      case "clicked":
        return "Link clicked";
      case "bounced":
        return "Email bounced";
      case "complained":
        return "Marked as spam";
      case "delivery_delayed":
        return "Delivery delayed";
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No events recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Event Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                  {getEventIcon(event.event_type)}
                </div>
                {index < events.length - 1 && (
                  <div className="w-px flex-1 bg-border" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="text-sm font-medium">{getEventLabel(event.event_type)}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(event.occurred_at), "MMM d, yyyy h:mm:ss a")}
                </p>
                {(event.event_data as Record<string, unknown>)?.click && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Link: {((event.event_data as Record<string, unknown>).click as Record<string, unknown>)?.link as string}
                  </p>
                )}
                {(event.event_data as Record<string, unknown>)?.bounce && (
                  <p className="text-xs text-destructive mt-1">
                    {((event.event_data as Record<string, unknown>).bounce as Record<string, unknown>)?.message as string}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
