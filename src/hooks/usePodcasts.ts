import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Podcast, PodcastInsert, PodcastUpdate, PodcastWithEpisodes } from "@/types/podcast";

/**
 * Fetch all podcasts for the current user
 */
export function usePodcasts() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["podcasts", user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("podcasts")
                .select("*")
                .eq("creator_id", user!.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Podcast[];
        },
        enabled: !!user,
    });
}

/**
 * Fetch a single podcast by ID, including its episodes and RSS import info
 */
export function usePodcast(podcastId: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["podcast", podcastId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("podcasts")
                .select("*")
                .eq("id", podcastId!)
                .single();

            if (error) throw error;

            // Fetch episodes
            const { data: episodes, error: episodesError } = await supabase
                .from("episodes")
                .select("*")
                .eq("podcast_id", podcastId!)
                .order("publish_date", { ascending: false });

            if (episodesError) throw episodesError;

            // Fetch RSS import if exists
            const { data: rssImport } = await supabase
                .from("rss_imports")
                .select("*")
                .eq("podcast_id", podcastId!)
                .maybeSingle();

            return {
                ...data,
                episodes: episodes || [],
                rss_import: rssImport,
            } as PodcastWithEpisodes;
        },
        enabled: !!podcastId && !!user,
    });
}

/**
 * Fetch a podcast by its slug (for public pages)
 */
export function usePodcastBySlug(slug: string | undefined) {
    return useQuery({
        queryKey: ["podcast-public", slug],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("podcasts")
                .select("*")
                .eq("slug", slug!)
                .eq("status", "published")
                .single();

            if (error) throw error;

            // Fetch published episodes
            const { data: episodes, error: episodesError } = await supabase
                .from("episodes")
                .select("*")
                .eq("podcast_id", data.id)
                .eq("status", "published")
                .order("publish_date", { ascending: false });

            if (episodesError) throw episodesError;

            return {
                ...data,
                episodes: episodes || [],
            } as PodcastWithEpisodes;
        },
        enabled: !!slug,
    });
}

/**
 * Create a new podcast
 */
export function useCreatePodcast() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (podcast: Omit<PodcastInsert, "creator_id">) => {
            const { data, error } = await supabase
                .from("podcasts")
                .insert({ ...podcast, creator_id: user!.id })
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

/**
 * Update an existing podcast
 */
export function useUpdatePodcast() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...updates }: PodcastUpdate & { id: string }) => {
            const { data, error } = await supabase
                .from("podcasts")
                .update(updates)
                .eq("id", id)
                .select()
                .single();

            if (error) throw error;
            return data as Podcast;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["podcasts"] });
            queryClient.invalidateQueries({ queryKey: ["podcast", data.id] });
            toast.success("Podcast updated!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update podcast");
        },
    });
}

/**
 * Delete a podcast
 */
export function useDeletePodcast() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (podcastId: string) => {
            const { error } = await supabase
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

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}
