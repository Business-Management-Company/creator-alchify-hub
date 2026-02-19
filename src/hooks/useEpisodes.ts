import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Episode, EpisodeInsert, EpisodeUpdate, EpisodeWithTranscription } from "@/types/podcast";

/**
 * Fetch all episodes for a podcast
 */
export function useEpisodes(podcastId: string | undefined) {
    return useQuery({
        queryKey: ["episodes", podcastId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("episodes")
                .select("*")
                .eq("podcast_id", podcastId!)
                .order("episode_number", { ascending: false });

            if (error) throw error;
            return data as Episode[];
        },
        enabled: !!podcastId,
    });
}

/**
 * Fetch a single episode by ID, with its transcription
 */
export function useEpisode(episodeId: string | undefined) {
    return useQuery({
        queryKey: ["episode", episodeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("episodes")
                .select("*")
                .eq("id", episodeId!)
                .single();

            if (error) throw error;

            // Fetch transcription if exists
            const { data: transcription } = await supabase
                .from("transcriptions")
                .select("*")
                .eq("episode_id", episodeId!)
                .maybeSingle();

            return {
                ...data,
                transcription,
            } as EpisodeWithTranscription;
        },
        enabled: !!episodeId,
    });
}

/**
 * Create a new episode
 */
export function useCreateEpisode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (episode: EpisodeInsert) => {
            const { data, error } = await supabase
                .from("episodes")
                .insert(episode)
                .select()
                .single();

            if (error) throw error;
            return data as Episode;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["episodes", data.podcast_id] });
            queryClient.invalidateQueries({ queryKey: ["podcast", data.podcast_id] });
            toast.success("Episode created successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create episode");
        },
    });
}

/**
 * Update an existing episode
 */
export function useUpdateEpisode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: EpisodeUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from("episodes")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Episode;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["episodes", data.podcast_id] });
            queryClient.invalidateQueries({ queryKey: ["episode", data.id] });
            queryClient.invalidateQueries({ queryKey: ["podcast", data.podcast_id] });
            toast.success("Episode updated!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update episode");
        },
    });
}

/**
 * Delete an episode
 */
export function useDeleteEpisode() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ episodeId, podcastId }: { episodeId: string; podcastId: string }) => {
            const { error } = await supabase
                .from("episodes")
                .delete()
                .eq("id", episodeId);

            if (error) throw error;
            return { podcastId };
        },
        onSuccess: ({ podcastId }) => {
            queryClient.invalidateQueries({ queryKey: ["episodes", podcastId] });
            queryClient.invalidateQueries({ queryKey: ["podcast", podcastId] });
            toast.success("Episode deleted");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete episode");
        },
    });
}

/**
 * Upload audio file to Supabase Storage and return the public URL
 */
export function useUploadAudio() {
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ file, podcastId }: { file: File; podcastId: string }) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user!.id}/${podcastId}/${crypto.randomUUID()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("podcast-audio")
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("podcast-audio")
                .getPublicUrl(fileName);

            return { url: publicUrl, fileSize: file.size };
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload audio file");
        },
    });
}

/**
 * Upload cover image to Supabase Storage and return the public URL
 */
export function useUploadCover() {
    const { user } = useAuth();

    return useMutation({
        mutationFn: async ({ file, podcastId }: { file: File; podcastId: string }) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user!.id}/${podcastId}/cover.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("podcast-covers")
                .upload(fileName, file, {
                    cacheControl: "3600",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("podcast-covers")
                .getPublicUrl(fileName);

            return publicUrl;
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to upload cover image");
        },
    });
}

/**
 * Get the next episode number for a podcast
 */
export function useNextEpisodeNumber(podcastId: string | undefined) {
    return useQuery({
        queryKey: ["next-episode-number", podcastId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("episodes")
                .select("episode_number")
                .eq("podcast_id", podcastId!)
                .order("episode_number", { ascending: false })
                .limit(1);

            if (error) throw error;
            return (data?.[0]?.episode_number || 0) + 1;
        },
        enabled: !!podcastId,
    });
}
