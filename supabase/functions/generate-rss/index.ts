import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function cdata(str: string): string {
    return `<![CDATA[${str}]]>`;
}

function formatDuration(totalSeconds: number | null): string {
    if (!totalSeconds || totalSeconds <= 0) return "00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) {
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toRfc2822(date: string | null): string {
    if (!date) return new Date().toUTCString();
    return new Date(date).toUTCString();
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        // Support both ?id=<uuid> and legacy ?slug=<uuid>
        let podcastId = url.searchParams.get("id") || url.searchParams.get("slug");

        // Support path-based invocation: /generate-rss/<id>
        if (!podcastId) {
            const pathParts = url.pathname.split("/").filter(Boolean);
            const last = pathParts[pathParts.length - 1];
            if (last && last !== "generate-rss") {
                podcastId = last;
            }
        }

        if (!podcastId) {
            return new Response(
                JSON.stringify({ error: "Missing podcast id parameter. Use ?id=<podcast-uuid>" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch podcast by ID (status can be 'active' or 'draft')
        const { data: podcast, error: podcastError } = await supabase
            .from("podcasts")
            .select("*")
            .eq("id", podcastId)
            .single();

        if (podcastError || !podcast) {
            console.error("Podcast fetch error:", podcastError);
            return new Response(
                JSON.stringify({ error: "Podcast not found", details: podcastError?.message }),
                {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Fetch published episodes ordered by pub_date descending
        const { data: episodes, error: episodesError } = await supabase
            .from("episodes")
            .select("*")
            .eq("podcast_id", podcast.id)
            .eq("status", "published")
            .order("pub_date", { ascending: false });

        if (episodesError) {
            throw new Error(`Failed to fetch episodes: ${episodesError.message}`);
        }

        const siteUrl =
            Deno.env.get("SITE_URL") ||
            Deno.env.get("PUBLIC_SITE_URL") ||
            "https://alchify.com";

        const podcastPageUrl = `${siteUrl}/podcast/${podcast.id}`;
        const feedSelfUrl = `${supabaseUrl}/functions/v1/generate-rss?id=${podcast.id}`;

        // Build episode items
        const items = (episodes || [])
            .map((ep: any) => {
                const guid = ep.guid || ep.id;
                const episodePageUrl = `${siteUrl}/podcast/${podcast.id}/episode/${ep.id}`;

                return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${cdata(ep.description || "")}</description>
      <link>${episodePageUrl}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${toRfc2822(ep.pub_date)}</pubDate>
      ${ep.audio_url ? `<enclosure url="${escapeXml(ep.audio_url)}" length="${ep.file_size_bytes || 0}" type="audio/mpeg" />` : ""}
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:summary>${cdata(ep.description || "")}</itunes:summary>
      <itunes:duration>${formatDuration(ep.duration_seconds)}</itunes:duration>
      <itunes:explicit>false</itunes:explicit>
      ${ep.episode_number ? `<itunes:episode>${ep.episode_number}</itunes:episode>` : ""}
      ${ep.season_number ? `<itunes:season>${ep.season_number}</itunes:season>` : ""}
    </item>`;
            })
            .join("\n");

        const categoryTag = podcast.category
            ? `<itunes:category text="${escapeXml(podcast.category)}" />`
            : `<itunes:category text="Society &amp; Culture" />`;

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(podcast.title)}</title>
    <description>${cdata(podcast.description || "")}</description>
    <link>${podcastPageUrl}</link>
    <language>${escapeXml(podcast.language || "en")}</language>
    <copyright>© ${new Date().getFullYear()} ${escapeXml(podcast.author || podcast.title)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedSelfUrl)}" rel="self" type="application/rss+xml" />
    <generator>Alchify Podcast Platform</generator>

    <!-- iTunes / Apple Podcasts tags -->
    <itunes:author>${escapeXml(podcast.author || podcast.title)}</itunes:author>
    <itunes:summary>${cdata(podcast.description || "")}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>${podcast.is_explicit ? "true" : "false"}</itunes:explicit>
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.author || "")}</itunes:name>
      ${podcast.author_email ? `<itunes:email>${escapeXml(podcast.author_email)}</itunes:email>` : ""}
    </itunes:owner>
    ${podcast.image_url ? `<itunes:image href="${escapeXml(podcast.image_url)}" />` : ""}
    ${podcast.image_url ? `<image><url>${escapeXml(podcast.image_url)}</url><title>${escapeXml(podcast.title)}</title><link>${podcastPageUrl}</link></image>` : ""}
    ${categoryTag}

    <podcast:locked>no</podcast:locked>

    <!-- Episodes -->
${items}
  </channel>
</rss>`;

        return new Response(rss, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/rss+xml; charset=utf-8",
                "Cache-Control": "public, max-age=300, s-maxage=300",
            },
        });
    } catch (error) {
        console.error("RSS generation error:", error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error occurred",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
