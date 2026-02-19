import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, X, Loader2, FileAudio, Check } from "lucide-react";
import { toast } from "sonner";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useEpisode, useCreateEpisode, useUpdateEpisode, useUploadAudio, useNextEpisodeNumber } from "@/hooks/useEpisodes";

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
    const [isUploading, setIsUploading] = useState(false);
    const [formInitialized, setFormInitialized] = useState(false);

    if (existingEpisode && !formInitialized) {
        setTitle(existingEpisode.title);
        setDescription(existingEpisode.description || "");
        setEpisodeNumber(existingEpisode.episode_number || "");
        setSeasonNumber(existingEpisode.season_number || "");
        setAudioUrl(existingEpisode.audio_url);
        setFileSize(existingEpisode.file_size_bytes);
        setPublishNow(existingEpisode.status === "published");
        setFormInitialized(true);
    }

    if (!isEditing && nextNumber && !episodeNumber && !formInitialized) {
        setEpisodeNumber(nextNumber);
        setFormInitialized(true);
    }

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("audio/")) {
            setAudioFile(file);
            if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        } else {
            toast.error("Please drop an audio file (MP3, M4A, WAV)");
        }
    }, [title]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAudioFile(file);
            if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const removeFile = () => {
        setAudioFile(null);
        if (!isEditing) { setAudioUrl(null); setFileSize(null); }
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
            setIsUploading(false);
        }

        if (!finalAudioUrl && !isEditing) { toast.error("Please upload an audio file"); return; }

        const episodeData = {
            podcast_id: podcastId,
            user_id: user.id,
            title: title.trim(),
            description: description.trim() || null,
            episode_number: episodeNumber || null,
            season_number: seasonNumber || null,
            audio_url: finalAudioUrl,
            file_size_bytes: finalFileSize,
            status: publishNow ? "published" : (scheduledDate ? "scheduled" : "draft"),
            pub_date: publishNow ? new Date().toISOString() : (scheduledDate || null),
        };

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
                                        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
                                        onDragOver={(e) => e.preventDefault()} onDrop={handleFileDrop} onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                                        <p className="font-medium mb-1">Drop your audio file here</p>
                                        <p className="text-sm text-muted-foreground">or click to browse · MP3, M4A, WAV · Max 200MB</p>
                                    </div>
                                )}
                                {isUploading && (
                                    <div className="mt-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Uploading...</span>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
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
