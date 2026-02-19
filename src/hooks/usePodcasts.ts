import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Podcast, PodcastInsert, PodcastUpdate, PodcastWithEpisodes } from "@/types/podcast";

export function usePodcasts() {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["podcasts", user?.id],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("podcasts")
                .select("*")
                .eq("user_id", user!.id)
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data as Podcast[];
        },
        enabled: !!user,
    });
}

export function usePodcast(podcastId: string | undefined) {
    const { user } = useAuth();
    return useQuery({
        queryKey: ["podcast", podcastId],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("podcasts")
                .select("*")
                .eq("id", podcastId!)
                .single();
            if (error) throw error;

            const { data: episodes, error: episodesError } = await (supabase as any)
                .from("episodes")
                .select("*")
                .eq("podcast_id", podcastId!)
                .order("pub_date", { ascending: false });
            if (episodesError) throw episodesError;

            const { data: rssImport } = await (supabase as any)
                .from("rss_imports")
                .select("*")
                .eq("podcast_id", podcastId!)
                .maybeSingle();

            return { ...data, episodes: episodes || [], rss_import: rssImport } as PodcastWithEpisodes;
        },
        enabled: !!podcastId && !!user,
    });
}

export function useCreatePodcast() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (podcast: Omit<PodcastInsert, "user_id">) => {
            const { data, error } = await (supabase as any)
                .from("podcasts")
                .insert({ ...podcast, user_id: user!.id })
                .select()
                .single();
            if (error) throw error;
            return data as Podcast;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["podcasts"] });
            toast.success("Podcast created successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create podcast");
        },
    });
}

export function useUpdatePodcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: PodcastUpdate & { id: string }) => {
            const { data, error } = await (supabase as any)
                .from("podcasts")
                .update(updates)
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data as Podcast;
        },
        onSuccess: (data: Podcast) => {
            queryClient.invalidateQueries({ queryKey: ["podcasts"] });
            queryClient.invalidateQueries({ queryKey: ["podcast", data.id] });
            toast.success("Podcast updated!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update podcast");
        },
    });
}

export function useDeletePodcast() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (podcastId: string) => {
            const { error } = await (supabase as any)
                .from("podcasts")
                .delete()
                .eq("id", podcastId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["podcasts"] });
            toast.success("Podcast deleted");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to delete podcast");
        },
    });
}
