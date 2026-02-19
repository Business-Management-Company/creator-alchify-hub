import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { ArrowLeft, Plus, Download, Mic, Globe, Tag } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useCreatePodcast, generateSlug } from "@/hooks/usePodcasts";
import { PODCAST_CATEGORIES, PODCAST_LANGUAGES } from "@/types/podcast";
import podcastIcon from "@/assets/podcast-icon.jpg";
import podcastImage from "@/assets/podcast-image.jpg";
import podcastStudio from "@/assets/podcast-studio.jpg";

const CreatePodcast = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"choice" | "details">("choice");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("en");
  const [isExplicit, setIsExplicit] = useState(false);
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  const createPodcast = useCreatePodcast();

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setSlug(generateSlug(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalSlug = slug || generateSlug(title);

    createPodcast.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        language,
        is_explicit: isExplicit,
        slug: finalSlug,
        author_name: authorName.trim() || null,
        website_url: websiteUrl.trim() || null,
        status: "draft",
      },
      {
        onSuccess: (data) => {
          navigate(`/podcasts/${data.id}`);
        },
      }
    );
  };

  if (step === "choice") {
    return (
      <AppLayout>
        <div className="bg-background p-6 flex items-center justify-center">
          <div className="max-w-5xl w-full">
            <Button variant="ghost" onClick={() => navigate("/podcasts")} className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Podcasts
            </Button>

            <h1 className="text-4xl font-bold mb-12 text-center">
              Add a new podcast to Alchify
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Create New */}
              <Card
                className="p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 bg-cover bg-center bg-no-repeat"
                onClick={() => setStep("details")}
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.55)), url(${podcastImage})`,
                }}
              >
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-6">
                  <Plus className="w-12 h-12 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Create a New Podcast</h2>
                <p className="text-gray-200">Have a new podcast idea? Let's go!</p>
              </Card>

              {/* Import Existing */}
              <Card
                className="p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:shadow-xl transition-all hover:scale-105 border-2 bg-cover bg-center bg-no-repeat"
                onClick={() => navigate("/podcasts/import")}
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.75)), url(${podcastStudio})`,
                }}
              >
                <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-6">
                  <Download className="w-12 h-12 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-white">Copy in an Existing Podcast</h2>
                <p className="text-gray-200">Have a podcast hosted elsewhere? Bring it over.</p>
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="bg-background p-6 flex items-center justify-center">
        <div className="max-w-3xl w-full">
          <Button variant="ghost" onClick={() => setStep("choice")} className="mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-8">
            {/* Podcast Icon */}
            <div className="flex justify-center">
              <img
                src={podcastIcon}
                alt="Podcast"
                className="w-32 h-32 rounded-2xl object-cover shadow-lg"
              />
            </div>

            <div>
              <h1 className="text-4xl font-bold mb-2 text-center">Create Your Podcast</h1>
              <p className="text-center text-muted-foreground">
                Set up your show details. You can always update these later.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                  <Mic className="w-4 h-4" /> Podcast Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="My Awesome Podcast"
                  className="mt-2"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug" className="text-base font-semibold flex items-center gap-2">
                  <Globe className="w-4 h-4" /> URL Slug
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    alchify.com/podcast/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="my-awesome-podcast"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-base font-semibold">
                  Podcast Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is your podcast about? Tell your listeners..."
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Category & Language row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Category
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PODCAST_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Language
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PODCAST_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Author Name */}
              <div>
                <Label htmlFor="authorName" className="text-base font-semibold">
                  Author / Host Name
                </Label>
                <Input
                  id="authorName"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name or show host name"
                  className="mt-2"
                />
              </div>

              {/* Website URL */}
              <div>
                <Label htmlFor="websiteUrl" className="text-base font-semibold">
                  Website URL (optional)
                </Label>
                <Input
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="mt-2"
                  type="url"
                />
              </div>

              {/* Explicit toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label className="text-base font-semibold">Explicit Content</Label>
                  <p className="text-sm text-muted-foreground">
                    Mark this podcast as containing explicit language or content
                  </p>
                </div>
                <Switch checked={isExplicit} onCheckedChange={setIsExplicit} />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={createPodcast.isPending || !title.trim()}
                  className="bg-black text-white hover:bg-black/90 px-12"
                >
                  {createPodcast.isPending ? "Creating..." : "Create Podcast"}
                </Button>
                <Button
                  type="button"
                  variant="link"
                  onClick={() => navigate("/podcasts")}
                  className="text-muted-foreground"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreatePodcast;
