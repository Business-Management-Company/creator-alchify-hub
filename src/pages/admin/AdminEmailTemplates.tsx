import { useState } from "react";
import { Plus, Mail, Megaphone, Pencil, Trash2, Send, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmailTemplates, useDeleteEmailTemplate, useUpdateEmailTemplate } from "@/hooks/useEmailTemplates";
import { EmailTemplateDialog } from "@/components/email/EmailTemplateDialog";
import { EmailPreviewDialog } from "@/components/email/EmailPreviewDialog";
import { SendEmailDialog } from "@/components/email/SendEmailDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function AdminEmailTemplates() {
  const [category, setCategory] = useState<string>("all");
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewingTemplate, setPreviewingTemplate] = useState<string | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: templates, isLoading } = useEmailTemplates(
    category === "all" ? undefined : category
  );
  const deleteTemplate = useDeleteEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    await updateTemplate.mutateAsync({ id, is_active: !currentStatus });
  };

  const handleDelete = async () => {
    if (deletingTemplate) {
      await deleteTemplate.mutateAsync(deletingTemplate);
      setDeletingTemplate(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Create and manage email templates for your users
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <Tabs value={category} onValueChange={setCategory}>
          <TabsList>
            <TabsTrigger value="all">All Templates</TabsTrigger>
            <TabsTrigger value="transactional">
              <Mail className="h-4 w-4 mr-2" />
              Transactional
            </TabsTrigger>
            <TabsTrigger value="marketing">
              <Megaphone className="h-4 w-4 mr-2" />
              Marketing
            </TabsTrigger>
          </TabsList>

          <TabsContent value={category} className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : templates?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first email template to get started
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates?.map((template) => (
                  <Card key={template.id} className="relative">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.subject}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={template.category === "transactional" ? "default" : "secondary"}
                          >
                            {template.category}
                          </Badge>
                          <Badge variant={template.is_active ? "default" : "outline"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      {template.variables && template.variables.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map((v: string) => (
                            <Badge key={v} variant="outline" className="text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Updated {format(new Date(template.updated_at), "MMM d, yyyy")}
                      </p>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewingTemplate(template.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTemplate(template.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSendingTemplate(template.id)}
                          disabled={!template.is_active}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(template.id, template.is_active)}
                        >
                          {template.is_active ? (
                            <ToggleRight className="h-4 w-4 text-primary" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTemplate(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <EmailTemplateDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <EmailTemplateDialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
        templateId={editingTemplate || undefined}
      />

      <EmailPreviewDialog
        open={!!previewingTemplate}
        onOpenChange={(open) => !open && setPreviewingTemplate(null)}
        templateId={previewingTemplate || undefined}
      />

      <SendEmailDialog
        open={!!sendingTemplate}
        onOpenChange={(open) => !open && setSendingTemplate(null)}
        templateId={sendingTemplate || undefined}
      />

      <AlertDialog open={!!deletingTemplate} onOpenChange={(open) => !open && setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
