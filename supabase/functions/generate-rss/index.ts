import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

/**
 * RSS Feed Generator — Supabase Edge Function
 *
 * Generates an Apple-Podcasts-compatible RSS 2.0 / iTunes XML feed
 * for a podcast identified by its `slug`.
 *
 * Endpoint:  GET /generate-rss?slug=<podcast-slug>
 *            (or invoked via the rewrite rule /feed/:slug)
 *
 * Response:  application/rss+xml with Cache-Control: max-age=300
 */

// --- XML helper -----------------------------------------------------------

function escapeXml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

function cdata(str: string): string {
    // Wrap in CDATA so HTML inside descriptions is preserved
    return `<![CDATA[${str}]]>`;
}

/**
 * Convert seconds (e.g. 3661) to HH:MM:SS (01:01:01).
 * iTunes requires this format.
 */
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

/**
 * RFC-2822 date string (required by RSS <pubDate>).
 */
function toRfc2822(date: string | null): string {
    if (!date) return new Date().toUTCString();
    return new Date(date).toUTCString();
}

// --- Main handler ----------------------------------------------------------

serve(async (req) => {
    // CORS pre-flight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Extract slug from URL query-string or path
        const url = new URL(req.url);
        let slug = url.searchParams.get("slug");

        // Support path-based invocation: /generate-rss/<slug>
        if (!slug) {
            const pathParts = url.pathname.split("/").filter(Boolean);
            slug = pathParts[pathParts.length - 1];
            // Don't treat the function name itself as the slug
            if (slug === "generate-rss") slug = null;
        }

        if (!slug) {
            return new Response(
                JSON.stringify({ error: "Missing slug parameter" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // Create Supabase client with service role (bypass RLS for public feed)
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // ------------------------------------------------------------------
        // 1. Fetch podcast by slug
        // ------------------------------------------------------------------
        const { data: podcast, error: podcastError } = await supabase
            .from("podcasts")
            .select("*")
            .eq("slug", slug)
            .eq("status", "published")
            .single();

        if (podcastError || !podcast) {
            return new Response(
                JSON.stringify({ error: "Podcast not found or not published" }),
                {
                    status: 404,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // ------------------------------------------------------------------
        // 2. Fetch published episodes, ordered newest-first
        // ------------------------------------------------------------------
        const { data: episodes, error: episodesError } = await supabase
            .from("episodes")
            .select("*")
            .eq("podcast_id", podcast.id)
            .eq("status", "published")
            .order("publish_date", { ascending: false });

        if (episodesError) {
            throw new Error(`Failed to fetch episodes: ${episodesError.message}`);
        }

        // ------------------------------------------------------------------
        // 3. Build the base URL for links
        // ------------------------------------------------------------------
        // Use the SITE_URL env var if set, otherwise fall back to Supabase URL
        const siteUrl =
            Deno.env.get("SITE_URL") ||
            Deno.env.get("PUBLIC_SITE_URL") ||
            "https://alchify.com";

        const podcastPageUrl = `${siteUrl}/podcast/${podcast.slug}`;
        const feedSelfUrl = `${supabaseUrl}/functions/v1/generate-rss?slug=${podcast.slug}`;

        // ------------------------------------------------------------------
        // 4. Build RSS XML
        // ------------------------------------------------------------------
        const items = (episodes || [])
            .map((ep: any) => {
                // Each episode needs a unique <guid>. Use external_guid for imports, else the episode id.
                const guid = ep.external_guid || ep.id;
                const episodePageUrl = `${siteUrl}/podcast/${podcast.slug}/${ep.id}`;

                return `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description>${cdata(ep.description || "")}</description>
      <link>${episodePageUrl}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <pubDate>${toRfc2822(ep.publish_date)}</pubDate>
      ${ep.audio_url ? `<enclosure url="${escapeXml(ep.audio_url)}" length="${ep.file_size_bytes || 0}" type="audio/mpeg" />` : ""}
      <itunes:title>${escapeXml(ep.title)}</itunes:title>
      <itunes:summary>${cdata(ep.description || "")}</itunes:summary>
      <itunes:duration>${formatDuration(ep.duration_seconds)}</itunes:duration>
      <itunes:explicit>${ep.is_explicit ? "true" : "false"}</itunes:explicit>
      <itunes:episodeType>${escapeXml(ep.episode_type || "full")}</itunes:episodeType>
      ${ep.episode_number ? `<itunes:episode>${ep.episode_number}</itunes:episode>` : ""}
      ${ep.season_number ? `<itunes:season>${ep.season_number}</itunes:season>` : ""}
      ${ep.show_notes ? `<content:encoded>${cdata(ep.show_notes)}</content:encoded>` : ""}
    </item>`;
            })
            .join("\n");

        // Map category to Apple's taxonomy
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
    <copyright>© ${new Date().getFullYear()} ${escapeXml(podcast.author_name || podcast.title)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedSelfUrl)}" rel="self" type="application/rss+xml" />
    <generator>Alchify Podcast Platform</generator>

    <!-- iTunes / Apple Podcasts tags -->
    <itunes:author>${escapeXml(podcast.author_name || podcast.title)}</itunes:author>
    <itunes:summary>${cdata(podcast.description || "")}</itunes:summary>
    <itunes:type>episodic</itunes:type>
    <itunes:explicit>${podcast.is_explicit ? "true" : "false"}</itunes:explicit>
    <itunes:owner>
      <itunes:name>${escapeXml(podcast.author_name || "")}</itunes:name>
      ${podcast.author_email ? `<itunes:email>${escapeXml(podcast.author_email)}</itunes:email>` : ""}
    </itunes:owner>
    ${podcast.cover_image_url ? `<itunes:image href="${escapeXml(podcast.cover_image_url)}" />` : ""}
    ${podcast.cover_image_url ? `<image><url>${escapeXml(podcast.cover_image_url)}</url><title>${escapeXml(podcast.title)}</title><link>${podcastPageUrl}</link></image>` : ""}
    ${categoryTag}
    ${podcast.website_url ? `<itunes:new-feed-url>${escapeXml(podcast.website_url)}</itunes:new-feed-url>` : ""}

    <!-- Podcast Index namespace -->
    <podcast:locked>no</podcast:locked>

    <!-- Episodes -->
${items}
  </channel>
</rss>`;

        // ------------------------------------------------------------------
        // 5. Return XML response with caching
        // ------------------------------------------------------------------
        return new Response(rss, {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/rss+xml; charset=utf-8",
                "Cache-Control": "public, max-age=300, s-maxage=300",
                "X-Robots-Tag": "noindex",
            },
        });
    } catch (error) {
        console.error("RSS generation error:", error);
        return new Response(
            JSON.stringify({
                error:
                    error instanceof Error ? error.message : "Unknown error occurred",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
