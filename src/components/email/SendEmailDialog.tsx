import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useEmailTemplate, useSendEmail } from "@/hooks/useEmailTemplates";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  recipients: z.array(z.string().email()).min(1, "At least one recipient is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  templateId,
}: SendEmailDialogProps) {
  const { data: template, isLoading } = useEmailTemplate(templateId);
  const sendEmail = useSendEmail();
  const [newRecipient, setNewRecipient] = useState("");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      recipients: [],
    },
  });

  const recipients = form.watch("recipients");

  const addRecipient = () => {
    const email = newRecipient.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !recipients.includes(email)) {
      form.setValue("recipients", [...recipients, email]);
      setNewRecipient("");
    }
  };

  const removeRecipient = (email: string) => {
    form.setValue(
      "recipients",
      recipients.filter((r) => r !== email)
    );
  };

  const onSubmit = async (values: FormValues) => {
    if (!templateId) return;

    await sendEmail.mutateAsync({
      templateId,
      to: values.recipients,
      variables: variableValues,
    });

    form.reset();
    setVariableValues({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Send this template to one or more recipients
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : template ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Template Info */}
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>{template.category}</Badge>
                  <span className="font-medium">{template.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Subject: {template.subject}
                </p>
              </div>

              {/* Recipients */}
              <FormField
                control={form.control}
                name="recipients"
                render={() => (
                  <FormItem>
                    <FormLabel>Recipients</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          value={newRecipient}
                          onChange={(e) => setNewRecipient(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addRecipient();
                            }
                          }}
                        />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={addRecipient}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {recipients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {recipients.map((email) => (
                          <Badge key={email} variant="secondary" className="gap-1">
                            {email}
                            <button type="button" onClick={() => removeRecipient(email)}>
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <FormDescription>
                      Press Enter or click + to add recipients
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variables */}
              {template.variables && template.variables.length > 0 && (
                <div className="space-y-4">
                  <FormLabel className="text-base">Template Variables</FormLabel>
                  <div className="grid gap-4">
                    {template.variables.map((v: string) => (
                      <div key={v} className="space-y-2">
                        <FormLabel htmlFor={v}>
                          <Badge variant="outline">{`{{${v}}}`}</Badge>
                        </FormLabel>
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

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={sendEmail.isPending || recipients.length === 0}>
                  <Send className="h-4 w-4 mr-2" />
                  {sendEmail.isPending ? "Sending..." : "Send Email"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Template not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
