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
    if (!totalSeconds || totalSeconds <= 0) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function toRfc2822(date: string | null): string {
    if (!date) return new Date().toUTCString();
    return new Date(date).toUTCString();
}

/** Strip HTML tags for plain-text summary */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").trim();
}

/** Extract storage path from a full Supabase storage URL */
function extractStoragePath(fullUrl: string, bucket: string): string | null {
    // Matches both /object/public/bucket/ and /object/sign/bucket/ patterns
    const patterns = [
        `/storage/v1/object/public/${bucket}/`,
        `/storage/v1/object/sign/${bucket}/`,
        `/storage/v1/object/${bucket}/`,
    ];
    for (const pattern of patterns) {
        const idx = fullUrl.indexOf(pattern);
        if (idx !== -1) {
            const path = fullUrl.substring(idx + pattern.length).split('?')[0];
            return decodeURIComponent(path);
        }
    }
    return null;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        let podcastId = url.searchParams.get("id") || url.searchParams.get("slug");

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
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data: podcast, error: podcastError } = await supabase
            .from("podcasts")
            .select("*")
            .eq("id", podcastId)
            .single();

        if (podcastError || !podcast) {
            console.error("Podcast fetch error:", podcastError);
            return new Response(
                JSON.stringify({ error: "Podcast not found", details: podcastError?.message }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (podcast.status !== 'active' && podcast.status !== 'published') {
            return new Response(
                JSON.stringify({ error: "Podcast not available" }),
                { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const { data: episodes, error: episodesError } = await supabase
            .from("episodes")
            .select("*")
            .eq("podcast_id", podcast.id)
            .eq("status", "published")
            .order("pub_date", { ascending: false });

        if (episodesError) {
            throw new Error(`Failed to fetch episodes: ${episodesError.message}`);
        }

        // Filter to only episodes with a valid audio_url
        const publishedEpisodes = (episodes || []).filter((ep: any) => ep.audio_url && ep.audio_url.trim() !== '');

        const siteUrl =
            Deno.env.get("SITE_URL") ||
            Deno.env.get("PUBLIC_SITE_URL") ||
            "https://alchify.com";

        const podcastPageUrl = `${siteUrl}/podcast/${podcast.id}`;
        const feedSelfUrl = `${siteUrl}/feed/${podcast.id}`;
        const author = podcast.author || podcast.title;
        const authorEmail = podcast.author_email || "";
        const podcastDescription = podcast.description || "";
        const isExplicit = podcast.is_explicit ? "yes" : "no";
        const language = podcast.language || "en";
        const imageUrl = podcast.image_url || "";

        // Determine the latest episode pub_date for lastBuildDate / pubDate
        const latestPubDate = publishedEpisodes.length > 0
            ? toRfc2822(publishedEpisodes[0].pub_date)
            : new Date().toUTCString();

        // Build category tag – support subcategories with "Category > Subcategory" format
        let categoryXml = "";
        if (podcast.category) {
            const parts = podcast.category.split(">");
            if (parts.length === 2) {
                categoryXml = `    <itunes:category text="${escapeXml(parts[0].trim())}">
      <itunes:category text="${escapeXml(parts[1].trim())}" />
    </itunes:category>`;
            } else {
                categoryXml = `    <itunes:category text="${escapeXml(podcast.category.trim())}" />`;
            }
        } else {
            categoryXml = `    <itunes:category text="Society &amp; Culture" />`;
        }

        // Build episode items (rss.com style)
        // Generate signed URLs for all episode audio files (7 days expiry)
        const signedAudioUrls: Record<string, string> = {};
        const signedImageUrls: Record<string, string> = {};
        
        const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 30; // 30 days
        
        await Promise.all(
            publishedEpisodes.map(async (ep: any) => {
                // Sign audio URL if it's a storage URL
                if (ep.audio_url && ep.audio_url.includes('/storage/v1/')) {
                    const storagePath = extractStoragePath(ep.audio_url, 'media-uploads');
                    if (storagePath) {
                        const { data } = await supabase.storage
                            .from('media-uploads')
                            .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
                        if (data?.signedUrl) {
                            signedAudioUrls[ep.id] = data.signedUrl;
                        }
                    }
                }
                // Sign episode image URL if it's a storage URL
                if (ep.image_url && ep.image_url.includes('/storage/v1/')) {
                    const storagePath = extractStoragePath(ep.image_url, 'media-uploads') || 
                                       extractStoragePath(ep.image_url, 'creator-assets');
                    const bucket = ep.image_url.includes('media-uploads') ? 'media-uploads' : 'creator-assets';
                    if (storagePath) {
                        const { data } = await supabase.storage
                            .from(bucket)
                            .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
                        if (data?.signedUrl) {
                            signedImageUrls[ep.id] = data.signedUrl;
                        }
                    }
                }
            })
        );

        // Also sign the podcast image if needed
        let signedPodcastImageUrl = imageUrl;
        if (imageUrl && imageUrl.includes('/storage/v1/')) {
            const bucket = imageUrl.includes('media-uploads') ? 'media-uploads' : 'creator-assets';
            const storagePath = extractStoragePath(imageUrl, bucket);
            if (storagePath) {
                const { data } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY);
                if (data?.signedUrl) {
                    signedPodcastImageUrl = data.signedUrl;
                }
            }
        }

        const items = (episodes || [])
            .map((ep: any) => {
                const guid = ep.guid || ep.id;
                const episodePageUrl = `${siteUrl}/podcast/${podcast.id}/episode/${ep.id}`;
                const epDescription = ep.description || "";
                const epExplicit = podcast.is_explicit ? "yes" : "no";
                const epImageUrl = signedImageUrls[ep.id] || ep.image_url || signedPodcastImageUrl;
                const audioUrl = signedAudioUrls[ep.id] || ep.audio_url;
                const audioType = ep.audio_url?.endsWith('.flac') ? 'audio/flac' : 
                                  ep.audio_url?.endsWith('.wav') ? 'audio/wav' : 
                                  ep.audio_url?.endsWith('.m4a') ? 'audio/mp4' : 'audio/mpeg';

                return `    <item>
      <title>${cdata(ep.title)}</title>
      <description>${cdata(epDescription)}</description>
      <link>${episodePageUrl}</link>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <dc:creator>${cdata(author)}</dc:creator>
      <pubDate>${toRfc2822(ep.pub_date)}</pubDate>
      <content:encoded>${cdata(epDescription)}</content:encoded>
      ${audioUrl ? `<enclosure url="${escapeXml(audioUrl)}" length="${ep.file_size_bytes || 0}" type="${audioType}" />` : ""}
      <itunes:title>${cdata(ep.title)}</itunes:title>
      <itunes:summary>${cdata(stripHtml(epDescription))}</itunes:summary>
      <itunes:author>${escapeXml(author)}</itunes:author>
      <itunes:image href="${escapeXml(epImageUrl)}" />
      <itunes:duration>${formatDuration(ep.duration_seconds)}</itunes:duration>
      <itunes:explicit>${epExplicit}</itunes:explicit>
      <itunes:episodeType>full</itunes:episodeType>
      ${ep.episode_number ? `<itunes:episode>${ep.episode_number}</itunes:episode>` : ""}
      ${ep.season_number ? `<itunes:season>${ep.season_number}</itunes:season>` : ""}
    </item>`;
            })
            .join("\n");

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:googleplay="http://www.google.com/schemas/play-podcasts/1.0"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${cdata(podcast.title)}</title>
    <description>${cdata(podcastDescription)}</description>
    <link>${podcastPageUrl}</link>
    <language>${escapeXml(language)}</language>
    <copyright>${cdata(`© ${new Date().getFullYear()} ${author}`)}</copyright>
    <generator>Alchify Podcast Platform</generator>
    <lastBuildDate>${latestPubDate}</lastBuildDate>
    <pubDate>${latestPubDate}</pubDate>
    <docs>https://www.rssboard.org/rss-specification</docs>
    <managingEditor>${authorEmail ? `${escapeXml(authorEmail)} (${escapeXml(author)})` : escapeXml(author)}</managingEditor>
    <atom:link href="${escapeXml(feedSelfUrl)}" rel="self" type="application/rss+xml" />
    ${podcast.rss_feed_url ? `<itunes:new-feed-url>${escapeXml(feedSelfUrl)}</itunes:new-feed-url>` : ""}
    <image>
      <url>${escapeXml(signedPodcastImageUrl)}</url>
      <title>${cdata(podcast.title)}</title>
      <link>${podcastPageUrl}</link>
    </image>

    <!-- iTunes tags -->
    <itunes:summary>${cdata(stripHtml(podcastDescription))}</itunes:summary>
    <itunes:author>${escapeXml(author)}</itunes:author>
    <itunes:explicit>${isExplicit}</itunes:explicit>
    <itunes:image href="${escapeXml(signedPodcastImageUrl)}" />
    <itunes:owner>
      <itunes:name>${cdata(author)}</itunes:name>
      <itunes:email>${escapeXml(authorEmail)}</itunes:email>
    </itunes:owner>
    <itunes:type>episodic</itunes:type>
    ${categoryXml}

    <!-- Google Play tags -->
    <googleplay:author>${escapeXml(author)}</googleplay:author>
    <googleplay:description>${cdata(stripHtml(podcastDescription))}</googleplay:description>
    <googleplay:image href="${escapeXml(signedPodcastImageUrl)}" />
    <googleplay:explicit>${isExplicit}</googleplay:explicit>
    ${podcast.category ? `<googleplay:category text="${escapeXml(podcast.category.split(">")[0].trim())}" />` : ""}

    <!-- Podcast 2.0 tags -->
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
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
