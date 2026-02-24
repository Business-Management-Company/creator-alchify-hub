import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Plus,
    Settings,
    List,
    Rss,
    Copy,
    Trash2,
    ExternalLink,
    Pencil,
    Music,
    Clock,
    Calendar,
    Play,
    Pause,
} from "lucide-react";
import { toast } from "sonner";
import { AudioPlayer } from "@/components/ui/audio-player";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { usePodcast, useUpdatePodcast, useDeletePodcast } from "@/hooks/usePodcasts";
import { useDeleteEpisode } from "@/hooks/useEpisodes";
import { PODCAST_CATEGORIES, PODCAST_LANGUAGES } from "@/types/podcast";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { Episode } from "@/types/podcast";

const PodcastDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: podcast, isLoading } = usePodcast(id);
    const updatePodcast = useUpdatePodcast();
    const deletePodcast = useDeletePodcast();
    const deleteEpisode = useDeleteEpisode();
    const { playEpisode, pauseEpisode, resumeEpisode, currentEpisode } = useAudioPlayer();

    const [isEditing, setIsEditing] = useState(false);
    const [expandedEpisode, setExpandedEpisode] = useState<string | null>(null);
    const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
    const [editForm, setEditForm] = useState({
        title: "", 
        description: "", 
        category: "", 
        language: "en",
        is_explicit: false, 
        author: "", 
        website_url: "",
    });

    const getSignedUrl = async (audioUrl: string) => {
        if (signedUrls[audioUrl]) return;
        try {
            const { data } = await supabase.storage
                .from("media-uploads")
                .createSignedUrl(audioUrl, 3600);
            if (data?.signedUrl) {
                setSignedUrls(prev => ({ ...prev, [audioUrl]: data.signedUrl }));
            }
        } catch (err) {
            console.error("Failed to get signed URL:", err);
        }
    };

    const toggleEpisodePlayer = (episode: Episode) => {
        if (expandedEpisode === episode.id) {
            setExpandedEpisode(null);
        } else {
            setExpandedEpisode(episode.id);
            if (episode.audio_url) getSignedUrl(episode.audio_url);
        }
    };

    const startEditing = () => {
        if (!podcast) return;
        setEditForm({
            title: podcast.title, 
            description: podcast.description || "",
            category: podcast.category || "", 
            language: podcast.language || "en",
            is_explicit: podcast.is_explicit || false, 
            author: podcast.author || "",
            website_url: podcast.website_url || "",
        });
        setIsEditing(true);
    };

    const handleSave = () => {
        if (!id) return;
        updatePodcast.mutate({
            id, 
            title: editForm.title, 
            description: editForm.description || null,
            category: editForm.category || null, 
            language: editForm.language,
            is_explicit: editForm.is_explicit, 
            author: editForm.author || null,
            website_url: editForm.website_url || null,
        }, { onSuccess: () => setIsEditing(false) });
    };

    const handlePublish = () => {
        if (!id) return;
        const newStatus = podcast?.status === "active" ? "draft" : "active";
        updatePodcast.mutate({ id, status: newStatus });
    };

    const handleDelete = () => {
        if (!id) return;
        deletePodcast.mutate(id, { onSuccess: () => navigate("/podcasts") });
    };

    const getPlayableUrl = async (audioUrl: string): Promise<string> => {
        // Check if this is a private supabase storage URL
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (audioUrl.includes(supabaseUrl) && audioUrl.includes('/media-uploads/')) {
            // Extract the path after the bucket name
            const pathMatch = audioUrl.match(/\/media-uploads\/(.+)$/);
            if (pathMatch) {
                const { data } = await supabase.storage
                    .from("media-uploads")
                    .createSignedUrl(pathMatch[1], 3600);
                if (data?.signedUrl) return data.signedUrl;
            }
        }
        // External URL (imported podcasts) — use directly
        return audioUrl;
    };

    const handlePlayEpisode = async (episode: Episode) => {
        if (!episode.audio_url) {
            toast.error("No audio file available for this episode");
            return;
        }

        if (currentEpisode?.id === episode.id && currentEpisode?.isPlaying) {
            pauseEpisode();
            return;
        }

        if (currentEpisode?.id === episode.id && !currentEpisode?.isPlaying) {
            resumeEpisode();
            return;
        }

        const playableUrl = await getPlayableUrl(episode.audio_url);
        playEpisode({
            id: episode.id,
            title: episode.title,
            audioUrl: playableUrl,
            podcastTitle: podcast?.title || "Unknown Podcast",
            podcastId: id,
            duration: episode.duration_seconds || 0,
        });
    };

    const formatDuration = (seconds: number | null) => {
        if (!seconds) return "—";
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "published": 
            case "active": 
                return "bg-green-500/10 text-green-600 border-green-200";
            case "draft": 
                return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
            case "scheduled": 
                return "bg-blue-500/10 text-blue-600 border-blue-200";
            default: 
                return "bg-gray-500/10 text-gray-600 border-gray-200";
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </AppLayout>
        );
    }

    if (!podcast) {
        return (
            <AppLayout>
                <div className="p-6 text-center">
                    <h2 className="text-2xl font-bold mb-4">Podcast not found</h2>
                    <Button onClick={() => navigate("/podcasts")}>Back to Podcasts</Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="bg-background p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/podcasts")}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold">{podcast.title}</h1>
                                    <Badge variant="outline" className={getStatusColor(podcast.status)}>
                                        {podcast.status}
                                    </Badge>
                                </div>
                                <p className="text-muted-foreground mt-1">
                                    {podcast.episodes.length} episodes · {podcast.category || "No category"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePublish}>
                                {podcast.status === "active" ? "Unpublish" : "Publish"}
                            </Button>
                        </div>
                    </div>

                    <Tabs defaultValue="episodes" className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="episodes" className="gap-2">
                                <List className="w-4 h-4" /> Episodes
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="gap-2">
                                <Settings className="w-4 h-4" /> Settings
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="episodes" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold">Episodes</h2>
                                <Button onClick={() => navigate(`/podcasts/${id}/episodes/new`)}>
                                    <Plus className="w-4 h-4 mr-2" /> New Episode
                                </Button>
                            </div>

                            {podcast.episodes.length === 0 ? (
                                <Card className="p-12 text-center">
                                    <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <h3 className="text-lg font-semibold mb-2">No episodes yet</h3>
                                    <p className="text-muted-foreground mb-6">Upload your first episode to get started</p>
                                    <Button onClick={() => navigate(`/podcasts/${id}/episodes/new`)}>
                                        <Plus className="w-4 h-4 mr-2" /> Add Episode
                                    </Button>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {podcast.episodes.map((episode: Episode) => (
                                        <Card key={episode.id} className="hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handlePlayEpisode(episode)}
                                                        className={`w-10 h-10 rounded-lg shrink-0 ${
                                                            currentEpisode?.id === episode.id
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                        }`}
                                                    >
                                                        {currentEpisode?.id === episode.id && currentEpisode?.isPlaying ? (
                                                            <Pause className="w-4 h-4" />
                                                        ) : (
                                                            <Play className="w-4 h-4" />
                                                        )}
                                                    </Button>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold truncate">{episode.title}</h3>
                                                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatDuration(episode.duration_seconds)}
                                                            </span>
                                                            {episode.pub_date && (
                                                                <span className="flex items-center gap-1">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {new Date(episode.pub_date).toLocaleDateString()}
                                                                </span>
                                                            )}
                                                            <Badge variant="outline" className={`text-xs ${getStatusColor(episode.status)}`}>
                                                                {episode.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => navigate(`/podcasts/${id}/episodes/${episode.id}`)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="text-destructive">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete Episode</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{episode.title}"? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => deleteEpisode.mutate({ episodeId: episode.id, podcastId: id! })}
                                                                    >
                                                                        Delete
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                                {expandedEpisode === episode.id && episode.audio_url && signedUrls[episode.audio_url] && (
                                                    <div className="mt-4">
                                                        <AudioPlayer
                                                            src={signedUrls[episode.audio_url]}
                                                            title={episode.title}
                                                            className="border-0 bg-muted/50"
                                                        />
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                            
                            {/* Public Podcast URL */}
                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4" /> Public Podcast Page
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-sm space-y-3">
                                    <p className="text-muted-foreground">
                                        Share this link or use it as your RSS redirect URL. Listeners can view all published episodes here.
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={`${window.location.origin}/podcast/${id}`}
                                            className="text-xs font-mono"
                                        />
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => {
                                                navigator.clipboard.writeText(`${window.location.origin}/podcast/${id}`);
                                                toast.success("Public URL copied to clipboard!");
                                            }}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            asChild
                                        >
                                            <a href={`/podcast/${id}`} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {podcast.rss_import && (
                                <Card className="mt-6">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Rss className="w-4 h-4" /> RSS Import
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-2">
                                        <p><strong>Feed URL:</strong> {podcast.rss_import.rss_url}</p>
                                        <p><strong>Status:</strong> {podcast.rss_import.status}</p>
                                        <p><strong>Episodes imported:</strong> {podcast.rss_import.episodes_imported}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="settings" className="space-y-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Podcast Details</CardTitle>
                                    {!isEditing ? (
                                        <Button variant="outline" size="sm" onClick={startEditing}>
                                            <Pencil className="w-4 h-4 mr-2" /> Edit
                                        </Button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                                                Cancel
                                            </Button>
                                            <Button size="sm" onClick={handleSave} disabled={updatePodcast.isPending}>
                                                {updatePodcast.isPending ? "Saving..." : "Save"}
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isEditing ? (
                                        <>
                                            <div>
                                                <Label>Title</Label>
                                                <Input 
                                                    value={editForm.title} 
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} 
                                                    className="mt-1" 
                                                />
                                            </div>
                                            <div>
                                                <Label>Description</Label>
                                                <Textarea 
                                                    value={editForm.description} 
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} 
                                                    rows={4} 
                                                    className="mt-1" 
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Category</Label>
                                                    <Select 
                                                        value={editForm.category} 
                                                        onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PODCAST_CATEGORIES.map((cat) => (
                                                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>Language</Label>
                                                    <Select 
                                                        value={editForm.language} 
                                                        onValueChange={(v) => setEditForm({ ...editForm, language: v })}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PODCAST_LANGUAGES.map((l) => (
                                                                <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Author / Host Name</Label>
                                                <Input 
                                                    value={editForm.author} 
                                                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })} 
                                                    className="mt-1" 
                                                />
                                            </div>
                                            <div>
                                                <Label>Website URL</Label>
                                                <Input 
                                                    value={editForm.website_url} 
                                                    onChange={(e) => setEditForm({ ...editForm, website_url: e.target.value })} 
                                                    className="mt-1" 
                                                    type="url" 
                                                />
                                            </div>
                                            <div className="flex items-center justify-between rounded-lg border p-3">
                                                <Label>Explicit Content</Label>
                                                <Switch 
                                                    checked={editForm.is_explicit} 
                                                    onCheckedChange={(v) => setEditForm({ ...editForm, is_explicit: v })} 
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-3 text-sm">
                                            <div className="grid grid-cols-[140px_1fr] gap-2">
                                                <span className="text-muted-foreground">Title</span>
                                                <span className="font-medium">{podcast.title}</span>
                                                
                                                <span className="text-muted-foreground">Description</span>
                                                <span>{podcast.description || "—"}</span>
                                                
                                                <span className="text-muted-foreground">Category</span>
                                                <span>{podcast.category || "—"}</span>
                                                
                                                <span className="text-muted-foreground">Language</span>
                                                <span>{PODCAST_LANGUAGES.find((l) => l.code === podcast.language)?.label || podcast.language}</span>
                                                
                                                <span className="text-muted-foreground">Author</span>
                                                <span>{podcast.author || "—"}</span>
                                                
                                                <span className="text-muted-foreground">Website</span>
                                                <span>{podcast.website_url || "—"}</span>
                                                
                                                <span className="text-muted-foreground">Explicit</span>
                                                <span>{podcast.is_explicit ? "Yes" : "No"}</span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete Podcast
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete "{podcast.title}"?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete this podcast and all its episodes.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction className="bg-destructive" onClick={handleDelete}>
                                                    Delete Forever
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
};

export default PodcastDetail;