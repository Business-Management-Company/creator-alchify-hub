import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  useEmailTemplate,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from "@/hooks/useEmailTemplates";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  subject: z.string().min(1, "Subject is required"),
  html_content: z.string().min(1, "HTML content is required"),
  text_content: z.string().optional(),
  category: z.enum(["transactional", "marketing"]),
  description: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EmailTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string;
}

export function EmailTemplateDialog({
  open,
  onOpenChange,
  templateId,
}: EmailTemplateDialogProps) {
  const isEditing = !!templateId;
  const { data: template, isLoading } = useEmailTemplate(templateId);
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate();
  const [variables, setVariables] = useState<string[]>([]);
  const [newVariable, setNewVariable] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subject: "",
      html_content: "",
      text_content: "",
      category: "transactional",
      description: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        subject: template.subject,
        html_content: template.html_content,
        text_content: template.text_content || "",
        category: template.category as "transactional" | "marketing",
        description: template.description || "",
        is_active: template.is_active,
      });
      setVariables(template.variables || []);
    } else if (!isEditing) {
      form.reset({
        name: "",
        subject: "",
        html_content: "",
        text_content: "",
        category: "transactional",
        description: "",
        is_active: true,
      });
      setVariables([]);
    }
  }, [template, isEditing, form]);

  const addVariable = () => {
    if (newVariable && !variables.includes(newVariable)) {
      setVariables([...variables, newVariable]);
      setNewVariable("");
    }
  };

  const removeVariable = (v: string) => {
    setVariables(variables.filter((x) => x !== v));
  };

  const onSubmit = async (values: FormValues) => {
    if (isEditing && templateId) {
      await updateTemplate.mutateAsync({
        id: templateId,
        ...values,
        variables,
      });
    } else {
      await createTemplate.mutateAsync({
        name: values.name,
        subject: values.subject,
        html_content: values.html_content,
        text_content: values.text_content,
        category: values.category,
        description: values.description,
        is_active: values.is_active,
        variables,
      });
    }
    onOpenChange(false);
  };

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Template" : "Create Template"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your email template"
              : "Create a new email template for your users"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="transactional">Transactional</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Line</FormLabel>
                    <FormControl>
                      <Input placeholder="Welcome to Alchify, {{name}}!" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use {`{{variable}}`} syntax for dynamic content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Sent when a new user signs up" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variables */}
              <div className="space-y-2">
                <FormLabel>Template Variables</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="variable_name"
                    value={newVariable}
                    onChange={(e) => setNewVariable(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVariable())}
                  />
                  <Button type="button" variant="outline" onClick={addVariable}>
                    Add
                  </Button>
                </div>
                {variables.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {variables.map((v) => (
                      <Badge key={v} variant="secondary" className="gap-1">
                        {`{{${v}}}`}
                        <button type="button" onClick={() => removeVariable(v)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Content Tabs */}
              <Tabs defaultValue="html">
                <TabsList>
                  <TabsTrigger value="html">HTML Content</TabsTrigger>
                  <TabsTrigger value="text">Plain Text (Optional)</TabsTrigger>
                </TabsList>
                <TabsContent value="html">
                  <FormField
                    control={form.control}
                    name="html_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="<h1>Welcome, {{name}}!</h1>..."
                            className="min-h-[300px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                <TabsContent value="text">
                  <FormField
                    control={form.control}
                    name="text_content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Welcome, {{name}}!..."
                            className="min-h-[300px] font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Only active templates can be used for sending emails
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : isEditing ? "Update Template" : "Create Template"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
