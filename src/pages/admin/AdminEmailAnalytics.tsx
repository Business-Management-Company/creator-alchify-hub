import { useState } from "react";
import { Mail, CheckCircle, Eye, MousePointer, XCircle, AlertTriangle, TrendingUp } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmailSends, useEmailStats } from "@/hooks/useEmailAnalytics";
import { useEmailTemplates } from "@/hooks/useEmailTemplates";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { EmailEventTimeline } from "@/components/email/EmailEventTimeline";

export default function AdminEmailAnalytics() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [selectedSendId, setSelectedSendId] = useState<string | null>(null);

  const { data: templates } = useEmailTemplates();
  const { data: stats, isLoading: statsLoading } = useEmailStats(
    selectedTemplate !== "all" ? { templateId: selectedTemplate } : undefined
  );
  const { data: sends, isLoading: sendsLoading } = useEmailSends({
    templateId: selectedTemplate !== "all" ? selectedTemplate : undefined,
    limit: 50,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Mail className="h-4 w-4" />;
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
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "outline",
      delivered: "secondary",
      opened: "default",
      clicked: "default",
      bounced: "destructive",
      complained: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Analytics</h1>
            <p className="text-muted-foreground">
              Track email performance and delivery metrics
            </p>
          </div>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              {templates?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.total || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.delivered || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.openRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.opened || 0} opened
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
                  <MousePointer className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.clickRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.clicked || 0} clicked
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.bounceRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {stats?.bounced || 0} bounced
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Complaints</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.complained || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sent || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Email Sends Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Email Activity</CardTitle>
            <CardDescription>View recent email sends and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {sendsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sends?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No emails sent yet
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Sent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sends?.map((send) => (
                      <TableRow
                        key={send.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedSendId(selectedSendId === send.id ? null : send.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(send.status)}
                            {getStatusBadge(send.status)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{send.to_email}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{send.subject}</TableCell>
                        <TableCell>
                          {send.template ? (
                            <Badge variant="outline">{send.template.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">Custom</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(send.sent_at), "MMM d, h:mm a")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {selectedSendId && (
                  <EmailEventTimeline emailSendId={selectedSendId} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
