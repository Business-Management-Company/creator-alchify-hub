import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useEmailTemplate } from "@/hooks/useEmailTemplates";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
}

export function EmailPreviewDialog({
  open,
  onOpenChange,
  templateId,
}: EmailPreviewDialogProps) {
  const { data: template, isLoading } = useEmailTemplate(templateId);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const previewHtml = useMemo(() => {
    if (!template) return "";
    let html = template.html_content;
    for (const v of template.variables || []) {
      const value = variableValues[v] || `{{${v}}}`;
      html = html.replace(new RegExp(`{{${v}}}`, "g"), value);
    }
    return html;
  }, [template, variableValues]);

  const previewSubject = useMemo(() => {
    if (!template) return "";
    let subject = template.subject;
    for (const v of template.variables || []) {
      const value = variableValues[v] || `{{${v}}}`;
      subject = subject.replace(new RegExp(`{{${v}}}`, "g"), value);
    }
    return subject;
  }, [template, variableValues]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preview Template</DialogTitle>
          <DialogDescription>
            Preview how your email will look with sample data
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : template ? (
          <div className="space-y-6">
            {/* Variable Inputs */}
            {template.variables && template.variables.length > 0 && (
              <div className="space-y-4 rounded-lg border p-4">
                <Label className="text-base font-semibold">Test Variables</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  {template.variables.map((v: string) => (
                    <div key={v} className="space-y-2">
                      <Label htmlFor={v}>
                        <Badge variant="outline">{`{{${v}}}`}</Badge>
                      </Label>
                      <Input
                        id={v}
                        placeholder={`Enter ${v}...`}
                        value={variableValues[v] || ""}
                        onChange={(e) =>
                          setVariableValues({ ...variableValues, [v]: e.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subject Preview */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Subject</Label>
              <div className="rounded-lg border bg-muted p-3">{previewSubject}</div>
            </div>

            {/* Content Preview */}
            <Tabs defaultValue="rendered">
              <TabsList>
                <TabsTrigger value="rendered">Rendered</TabsTrigger>
                <TabsTrigger value="html">HTML Source</TabsTrigger>
              </TabsList>
              <TabsContent value="rendered">
                <div className="rounded-lg border bg-background">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full min-h-[400px] border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              </TabsContent>
              <TabsContent value="html">
                <pre className="rounded-lg border bg-muted p-4 overflow-auto max-h-[400px] text-sm font-mono">
                  {previewHtml}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Template not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
