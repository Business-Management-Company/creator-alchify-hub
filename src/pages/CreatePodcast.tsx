import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Plus, Download } from "lucide-react";
import podcastIcon from "@/assets/podcast-icon.jpg";
import podcastImage from "@/assets/podcast-image.jpg";
import podcastStudio from "@/assets/podcast-studio.jpg";
import AppLayout from "@/components/layout/AppLayout";

const CreatePodcast = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"choice" | "details">("choice");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) throw new Error("Not authenticated");
      return user;
    },
  });

  const createPodcast = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await (supabase as any)
        .from("podcasts")
        .insert({
          user_id: user.id,
          title,
          description,
          is_published: false,
          show_on_profile: true,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Podcast created successfully!");
      navigate(`/podcasts/${data.id}`);
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to create podcast");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a podcast title");
      return;
    }
    createPodcast.mutate();
  };

  const handleSkip = () => {
    if (!user) return;
    // Create with minimal data
    (supabase as any)
      .from("podcasts")
      .insert({
        user_id: user.id,
        title: "Untitled Podcast",
        is_published: false,
        show_on_profile: true,
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          toast.error("Failed to create podcast");
          return;
        }
        toast.success("Podcast created! You can update details anytime.");
        navigate(`/podcasts/${data.id}`);
      });
  };

  if (step === "choice") {
    return (
      <AppLayout>
        <div className="bg-background p-6 flex items-center justify-center">
        <div className="max-w-5xl w-full">
          <Button
            variant="ghost"
            onClick={() => navigate("/podcasts")}
            className="mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Podcasts
          </Button>

          <h1 className="text-4xl font-bold mb-12 text-center">
            Add a new podcast to Alcify
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
              <p className="text-gray-200">
                Have a new podcast idea? Let's go!
              </p>
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
              <p className="text-gray-200">
                Have a podcast hosted elsewhere? Bring it over.
              </p>
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
        <Button
          variant="ghost"
          onClick={() => setStep("choice")}
          className="mb-8"
        >
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
            <h1 className="text-4xl font-bold mb-2 text-center">
              Add some podcast details
            </h1>
            <p className="text-center text-muted-foreground">
              Take a quick moment to add some information about your new podcast.{" "}
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded">
                You can update this anytime.
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Podcast Title */}
            <div>
              <Label htmlFor="title" className="text-lg font-semibold">
                Podcast Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="For Marines. By Marines's Podcast"
                className="mt-2"
              />
            </div>

            {/* Podcast Description */}
            <div>
              <Label htmlFor="description" className="text-lg font-semibold">
                Podcast Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="One or two sentences that describe your podcast."
                rows={4}
                className="mt-2"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-between pt-6">
              <Button
                type="submit"
                size="lg"
                disabled={createPodcast.isPending}
                className="bg-black text-white hover:bg-black/90 px-12"
              >
                {createPodcast.isPending ? "Creating..." : "Done. Let's start podcasting."}
              </Button>
              <Button
                type="button"
                variant="link"
                onClick={handleSkip}
                className="text-muted-foreground underline"
              >
                Skip for now, I'll update later
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
