import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { XMLParser } from "https://esm.sh/fast-xml-parser@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MAX_FEED_SIZE = 5_000_000; // 5MB
const FETCH_TIMEOUT_MS = 8000; // 8 seconds

// Supabase client inside Edge Function
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const rssUrl = body.rssUrl;

    if (!rssUrl) {
      return new Response(JSON.stringify({ error: "Missing rssUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL
    if (!rssUrl.startsWith("https://")) {
      return new Response(
        JSON.stringify({ error: "Only HTTPS URLs are allowed" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Block internal IPs (SSRF)
    const blockedHosts = ["127.", "10.", "192.168.", "172.16.", "localhost"];
    const urlObj = new URL(rssUrl);
    if (blockedHosts.some((host) => urlObj.hostname.startsWith(host))) {
      return new Response(JSON.stringify({ error: "Forbidden host" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch RSS with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const feedResponse = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch RSS feed: ${feedResponse.status}`);
    }

    const contentLength = parseInt(
      feedResponse.headers.get("content-length") || "0",
    );
    if (contentLength > MAX_FEED_SIZE) {
      throw new Error("Feed too large");
    }

    const xmlText = await feedResponse.text();
    if (xmlText.length > MAX_FEED_SIZE) {
      throw new Error("Feed too large");
    }

    // Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true,
      cdataPropName: "#text",
    });
    const feedJson = parser.parse(xmlText);

    if (!feedJson.rss || !feedJson.rss.channel) {
      throw new Error("Invalid RSS feed");
    }

    const channel = feedJson.rss.channel;

    // Extract podcast metadata
    const podcastMeta = {
      title: channel.title ?? "",
      description: channel.description ?? "",
      cover_image_url:
        channel["itunes:image"]?.["@_href"] ?? channel.image?.url ?? null,
      website_url: channel.link ?? null,
      language: channel.language ?? "en",
      author_name: channel["itunes:author"] ?? channel.author ?? null,
      author_email: channel["itunes:email"] ?? null,
      category: channel["itunes:category"]?.["@_text"] ?? null,
      is_explicit: channel["itunes:explicit"] === "yes",
    };

    // Episodes array
    const rawItems = Array.isArray(channel.item)
      ? channel.item
      : [channel.item];
    const episodes = rawItems
      .filter((item) => item && item.enclosure?.["@_url"])
      .map((item) => {
        // Duration parsing
        let durationSeconds = 0;
        const duration = item["itunes:duration"];
        if (duration) {
          if (duration.includes(":")) {
            const parts = duration.split(":").map(Number);
            if (parts.length === 3)
              durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
            else if (parts.length === 2)
              durationSeconds = parts[0] * 60 + parts[1];
          } else {
            durationSeconds = parseInt(duration, 10) || 0;
          }
        }

        return {
          title: item.title ?? "Untitled Episode",
          description: item.description ?? item["itunes:summary"] ?? "",
          pubDate: item.pubDate ?? new Date().toISOString(),
          guid: item.guid ?? null,
          audioUrl: item.enclosure["@_url"],
          fileSizeBytes: parseInt(item.enclosure["@_length"] || "0", 10),
          durationSeconds,
          episodeNumber: parseInt(item["itunes:episode"] || "0", 10) || null,
          seasonNumber: parseInt(item["itunes:season"] || "0", 10) || null,
          episodeType: item["itunes:episodeType"] ?? "full",
          isExplicit: item["itunes:explicit"] === "yes",
        };
      });

    // Transactional insert using Supabase
    const { data: existingPodcast } = await supabase
      .from("podcasts")
      .select("id")
      .eq("rss_feed_url", rssUrl)
      .maybeSingle();

    if (existingPodcast) {
      return new Response(
        JSON.stringify({ error: "Podcast already imported" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate slug (ensure unique)
    let slugBase = podcastMeta.title.toLowerCase().replace(/\s+/g, "-");
    let slug = slugBase;
    let counter = 1;
    while (true) {
      const { data: exists } = await supabase
        .from("podcasts")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      if (!exists) break;
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    // Create podcast record
    const { data: podcast, error: podcastError } = await supabase
      .from("podcasts")
      .insert({
        creator_id: user.user.id,
        slug,
        title: podcastMeta.title,
        description: podcastMeta.description,
        cover_image_url: podcastMeta.cover_image_url,
        author_name: podcastMeta.author_name,
        author_email: podcastMeta.author_email,
        website_url: podcastMeta.website_url,
        language: podcastMeta.language,
        category: podcastMeta.category,
        is_explicit: podcastMeta.is_explicit,
        status: "published",
        rss_feed_url: rssUrl,
      })
      .select()
      .single();
    if (podcastError) throw podcastError;

    // Create rss_import record
    await supabase.from("rss_imports").insert({
      podcast_id: podcast.id,
      feed_url: rssUrl,
      sync_status: "success",
      last_synced_at: new Date().toISOString(),
      episodes_imported: 0,
      auto_sync: true,
    });

    // Insert episodes with deduplication
    const chunkSize = 100;
    for (let i = 0; i < episodes.length; i += chunkSize) {
      const chunk = episodes.slice(i, i + chunkSize);
      await supabase.from("episodes").upsert(
        chunk.map((ep) => ({
          podcast_id: podcast.id,
          title: ep.title,
          description: ep.description,
          audio_url: ep.audioUrl,
          file_size_bytes: ep.fileSizeBytes,
          duration_seconds: ep.durationSeconds,
          publish_date: new Date(ep.pubDate).toISOString(),
          episode_number: ep.episodeNumber,
          season_number: ep.seasonNumber,
          episode_type: ep.episodeType,
          is_explicit: ep.isExplicit,
          status: "published",
          source: "rss",
          external_guid: ep.guid,
        })),
        { onConflict: ["podcast_id", "external_guid"] },
      );
    }

    // Update import count
    await supabase
      .from("rss_imports")
      .update({ episodes_imported: episodes.length })
      .eq("podcast_id", podcast.id);

    return new Response(JSON.stringify({ podcast, episodes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("RSS import error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
