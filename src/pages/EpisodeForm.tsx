import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, X, Loader2, FileAudio, Check, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEpisode, useCreateEpisode, useUpdateEpisode, useUploadAudio, useNextEpisodeNumber } from "@/hooks/useEpisodes";
import { supabase } from "@/integrations/supabase/client";
import { isAllowedAudioFile, AUDIO_ACCEPT } from "@/lib/audio-validation";

const EpisodeForm = () => {
    const { id: podcastId, eid: episodeId } = useParams<{ id: string; eid: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isEditing = !!episodeId;

    const { data: existingEpisode, isLoading: loadingEpisode } = useEpisode(episodeId);
    const { data: nextNumber } = useNextEpisodeNumber(podcastId);
    const createEpisode = useCreateEpisode();
    const updateEpisode = useUpdateEpisode();
    const uploadAudio = useUploadAudio();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [episodeNumber, setEpisodeNumber] = useState<number | "">("");
    const [seasonNumber, setSeasonNumber] = useState<number | "">("");
    const [publishNow, setPublishNow] = useState(true);
    const [scheduledDate, setScheduledDate] = useState("");

    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number | null>(null);
    const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formInitialized, setFormInitialized] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    if (existingEpisode && !formInitialized) {
        setTitle(existingEpisode.title);
        setDescription(existingEpisode.description || "");
        setEpisodeNumber(existingEpisode.episode_number || "");
        setSeasonNumber(existingEpisode.season_number || "");
        setAudioUrl(existingEpisode.audio_url);
        setFileSize(existingEpisode.file_size_bytes);
        setPublishNow(existingEpisode.status === "published");
        if ((existingEpisode as any).image_url) {
            setImageUrl((existingEpisode as any).image_url);
            setImagePreview((existingEpisode as any).image_url);
        }
        setFormInitialized(true);
    }

    if (!isEditing && nextNumber && !episodeNumber && !formInitialized) {
        setEpisodeNumber(nextNumber);
        setFormInitialized(true);
    }

    const getAudioDuration = (file: File): Promise<number> => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.addEventListener('loadedmetadata', () => {
                resolve(Math.round(audio.duration));
                URL.revokeObjectURL(audio.src);
            });
            audio.addEventListener('error', () => {
                resolve(0);
                URL.revokeObjectURL(audio.src);
            });
            audio.src = URL.createObjectURL(file);
        });
    };

    const handleFileDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        const check = isAllowedAudioFile(file);
        if (!check.valid) {
            toast.error(check.error);
            return;
        }
        setAudioFile(file);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        try {
            const dur = await getAudioDuration(file);
            if (dur > 0) setDurationSeconds(dur);
        } catch {
            setDurationSeconds(0);
        }
    }, [title]);

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const check = isAllowedAudioFile(file);
        if (!check.valid) {
            toast.error(check.error);
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }
        setAudioFile(file);
        if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        try {
            const dur = await getAudioDuration(file);
            if (dur > 0) setDurationSeconds(dur);
        } catch {
            setDurationSeconds(0);
        }
    }, [title]);

    const openFilePicker = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    }, []);

    const removeFile = () => {
        setAudioFile(null);
        if (!isEditing) { setAudioUrl(null); setFileSize(null); }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (!isEditing) setImageUrl(null);
    };

    const uploadImage = async (): Promise<string | null> => {
        if (!imageFile || !user) return imageUrl;
        const ext = imageFile.name.split(".").pop();
        const path = `episode-covers/${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("creator-assets").upload(path, imageFile, { upsert: true });
        if (error) { console.error("Image upload error:", error); toast.error(`Failed to upload image: ${error.message}`); return imageUrl; }
        const { data: urlData } = supabase.storage.from("creator-assets").getPublicUrl(path);
        return urlData.publicUrl;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!podcastId || !user) return;
        if (!title.trim()) { toast.error("Please enter an episode title"); return; }

        let finalAudioUrl = audioUrl;
        let finalFileSize = fileSize;

        if (audioFile) {
            setIsUploading(true);
            try {
                const result = await uploadAudio.mutateAsync({ file: audioFile, podcastId });
                finalAudioUrl = result.url;
                finalFileSize = result.fileSize;
            } catch { setIsUploading(false); return; }
        }

        let finalImageUrl = imageUrl;
        if (imageFile) {
            finalImageUrl = await uploadImage();
        }

        if (!finalAudioUrl && !isEditing) { toast.error("Please upload an audio file"); setIsUploading(false); return; }

        const episodeData: any = {
            podcast_id: podcastId,
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            episode_number: episodeNumber || null,
            season_number: seasonNumber || null,
            audio_url: finalAudioUrl,
            file_size_bytes: finalFileSize,
            duration_seconds: durationSeconds || null,
            status: publishNow ? "published" : (scheduledDate ? "scheduled" : "draft"),
            pub_date: publishNow ? new Date().toISOString() : (scheduledDate || null),
            image_url: finalImageUrl || null,
        };

        setIsUploading(false);

        if (isEditing && episodeId) {
            updateEpisode.mutate({ id: episodeId, ...episodeData }, { onSuccess: () => navigate(`/podcasts/${podcastId}`) });
        } else {
            createEpisode.mutate(episodeData, { onSuccess: () => navigate(`/podcasts/${podcastId}`) });
        }
    };

    const isSaving = createEpisode.isPending || updateEpisode.isPending || isUploading;

    if (isEditing && loadingEpisode) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="bg-background p-6 flex items-center justify-center">
                <div className="max-w-3xl w-full">
                    <Button variant="ghost" onClick={() => navigate(`/podcasts/${podcastId}`)} className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Podcast
                    </Button>

                    <h1 className="text-3xl font-bold mb-8">{isEditing ? "Edit Episode" : "New Episode"}</h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <Label className="text-base font-semibold mb-3 block">Audio File</Label>
                                {audioFile || audioUrl ? (
                                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                                        <FileAudio className="w-8 h-8 text-primary shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{audioFile ? audioFile.name : "Current audio file"}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {audioFile ? formatFileSize(audioFile.size) : (fileSize ? formatFileSize(fileSize) : "")}
                                            </p>
                                        </div>
                                        {audioFile && <Check className="w-5 h-5 text-green-500 shrink-0" />}
                                        <Button type="button" variant="ghost" size="icon" onClick={removeFile}><X className="w-4 h-4" /></Button>
                                    </div>
                                ) : (
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                        onDrop={handleFileDrop}
                                        onClick={openFilePicker}
                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFilePicker(); } }}
                                    >
                                        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                        <p className="font-medium mb-1">Drop your audio file here</p>
                                        <p className="text-sm text-muted-foreground">or click to browse · MP3, M4A, AAC, WAV, WebM, OGG, FLAC · Max 200MB</p>
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Uploading...</span>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept={AUDIO_ACCEPT} className="hidden" onChange={handleFileSelect} aria-label="Select audio file" />
                            </CardContent>
                        </Card>

                        {/* Episode Cover Image */}
                        <Card>
                            <CardContent className="p-6">
                                <Label className="text-base font-semibold mb-3 block">Episode Cover Image (optional)</Label>
                                <p className="text-sm text-muted-foreground mb-3">Override the podcast cover for this episode. Required: Exactly 3000×3000 pixels, JPG or PNG.</p>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-28 h-28 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors shrink-0"
                                        onClick={() => imageInputRef.current?.click()}
                                    >
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Episode cover" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                                                <ImagePlus className="w-6 h-6" />
                                                <span className="text-xs">Upload</span>
                                            </div>
                                        )}
                                    </div>
                                    {imagePreview && (
                                        <Button type="button" variant="ghost" size="sm" onClick={removeImage}>
                                            <X className="w-4 h-4 mr-1" /> Remove
                                        </Button>
                                    )}
                                </div>
                                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title" className="text-base font-semibold">Episode Title *</Label>
                                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Episode title" className="mt-2" required />
                            </div>
                            <div>
                                <Label htmlFor="description" className="text-base font-semibold">Description</Label>
                                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief episode description" rows={3} className="mt-2" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="episodeNumber">Episode #</Label>
                                    <Input id="episodeNumber" type="number" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value ? parseInt(e.target.value) : "")} placeholder="1" min={1} className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="seasonNumber">Season #</Label>
                                    <Input id="seasonNumber" type="number" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value ? parseInt(e.target.value) : "")} placeholder="1" min={1} className="mt-1" />
                                </div>
                            </div>
                            <div className="rounded-lg border p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-semibold">Publish Immediately</Label>
                                        <p className="text-sm text-muted-foreground">{publishNow ? "Episode will be published right away" : "Save as draft or schedule"}</p>
                                    </div>
                                    <Switch checked={publishNow} onCheckedChange={setPublishNow} />
                                </div>
                                {!publishNow && (
                                    <div>
                                        <Label htmlFor="scheduledDate">Schedule Date (optional)</Label>
                                        <Input id="scheduledDate" type="datetime-local" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="mt-1 w-auto" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <Button type="submit" size="lg" disabled={isSaving || !title.trim()}>
                                {isSaving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>) : (isEditing ? "Update Episode" : "Create Episode")}
                            </Button>
                            <Button type="button" variant="link" onClick={() => navigate(`/podcasts/${podcastId}`)} className="text-muted-foreground">Cancel</Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
};

export default EpisodeForm;
