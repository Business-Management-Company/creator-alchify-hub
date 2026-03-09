import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Mic, Globe, Tag, ImagePlus, Loader2 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useCreatePodcast } from "@/hooks/usePodcasts";
import { PODCAST_CATEGORIES, PODCAST_LANGUAGES } from "@/types/podcast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { validatePodcastCoverImage } from "@/lib/image-validation";

const CreatePodcast = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [isExplicit, setIsExplicit] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPodcast = useCreatePodcast();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await validatePodcastCoverImage(file);
    if (!result.valid) {
      toast.error(result.error);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `podcast-covers/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("creator-assets")
      .upload(path, imageFile, { upsert: true });
    if (error) {
      toast.error(error.message || "Failed to upload image");
      return null;
    }
    const { data: urlData } = supabase.storage
      .from("creator-assets")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }
    setUploading(false);

    createPodcast.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        language,
        is_explicit: isExplicit,
        author: authorName.trim() || null,
        author_email: authorEmail.trim() || null,
        website_url: websiteUrl.trim() || null,
        image_url: imageUrl,
        status: "draft",
      },
      {
        onSuccess: (data) => {
          navigate(`/podcasts/${data.id}`);
        },
      }
    );
  };

  return (
    <AppLayout>
      <div className="bg-background p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <Button variant="ghost" onClick={() => navigate("/podcasts")} className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Podcasts
          </Button>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 text-center">Create Your Podcast</h1>
              <p className="text-center text-muted-foreground">
                Set up your show details. You can always update these later.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Image */}
              <div className="flex flex-col items-center gap-3">
                <Label className="text-base font-semibold">Cover Image</Label>
                <div
                  className="w-40 h-40 rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-xs">Upload Image</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <p className="text-xs text-muted-foreground">Required for distribution: 1400×1400 to 3000×3000, square, JPG or PNG</p>
              </div>

              <div>
                <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Podcast Title *
                </Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="My Awesome Podcast" className="mt-2" required />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-semibold">Podcast Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is your podcast about?" rows={4} className="mt-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2"><Tag className="w-4 h-4" /> Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2"><SelectValue placeholder="Select a category" /></SelectTrigger>
                    <SelectContent>
                      {PODCAST_CATEGORIES.map((cat) => (<SelectItem key={cat} value={cat}>{cat}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PODCAST_LANGUAGES.map((lang) => (<SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="authorName" className="text-base font-semibold">Author / Host Name</Label>
                  <Input id="authorName" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Your name" className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="authorEmail" className="text-base font-semibold">Author Email</Label>
                  <Input id="authorEmail" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="contact@example.com" className="mt-2" type="email" />
                  <p className="text-xs text-muted-foreground mt-1">Required for Apple Podcasts &amp; Spotify distribution</p>
                </div>
              </div>

              <div>
                <Label htmlFor="websiteUrl" className="text-base font-semibold">Website URL (optional)</Label>
                <Input id="websiteUrl" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yourwebsite.com" className="mt-2" type="url" />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base font-semibold">Explicit Content</Label>
                  <p className="text-sm text-muted-foreground">Mark this podcast as containing explicit content</p>
                </div>
                <Switch checked={isExplicit} onCheckedChange={setIsExplicit} />
              </div>

              <div className="flex items-center justify-between pt-6">
                <Button type="submit" size="lg" disabled={createPodcast.isPending || uploading || !title.trim()}>
                  {(uploading || createPodcast.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {uploading ? "Uploading image..." : createPodcast.isPending ? "Creating..." : "Create Podcast"}
                </Button>
                <Button type="button" variant="link" onClick={() => navigate("/podcasts")} className="text-muted-foreground">Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreatePodcast;
