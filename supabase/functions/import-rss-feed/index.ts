import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_FEED_SIZE = 5_000_000;
const FETCH_TIMEOUT_MS = 8000;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// Safely extract a string from parsed XML value (handles CDATA objects, nested values, etc.)
function textOf(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if ("#text" in obj) return textOf(obj["#text"]);
    if ("__cdata" in obj) return textOf(obj["__cdata"]);
  }
  return String(val);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth
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

    // Fetch RSS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const feedResponse = await fetch(rssUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!feedResponse.ok) {
      throw new Error(`Failed to fetch RSS feed: ${feedResponse.status}`);
    }

    const xmlText = await feedResponse.text();
    if (xmlText.length > MAX_FEED_SIZE) {
      throw new Error("Feed too large");
    }

    // Parse XML using regex (no external XML lib needed)
    const getTag = (text: string, tag: string): string => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const m = text.match(re);
      if (!m) return "";
      return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, "").trim();
    };
    const getAttr = (text: string, tag: string, attr: string): string => {
      const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, "i");
      const m = text.match(re);
      return m ? m[1] : "";
    };

    const channelMatch = xmlText.match(/<channel>([\s\S]*?)<\/channel>/i);
    if (!channelMatch) throw new Error("Invalid RSS feed - no channel element");
    const ch = channelMatch[1];

    const podcastTitle = getTag(ch, "title") || "Untitled Podcast";
    const podcastMeta = {
      title: podcastTitle,
      description: getTag(ch, "description"),
      image_url: getAttr(ch, "itunes:image", "href") || getTag(ch, "url") || null,
      website_url: getTag(ch, "link") || null,
      language: getTag(ch, "language") || "en",
      author: getTag(ch, "itunes:author") || null,
      author_email: getTag(ch, "itunes:email") || null,
      category: getAttr(ch, "itunes:category", "text") || null,
      is_explicit: getTag(ch, "itunes:explicit").toLowerCase() === "yes",
    };

    console.log("Parsed podcast:", podcastMeta.title);

    // Parse episodes
    const itemMatches = [...ch.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    const episodes = itemMatches
      .map((match) => {
        const item = match[1];
        const audioUrl = getAttr(item, "enclosure", "url");
        if (!audioUrl) return null;

        const durStr = getTag(item, "itunes:duration");
        let durationSeconds = 0;
        if (durStr) {
          const parts = durStr.split(":").map(Number);
          if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
          else durationSeconds = parseInt(durStr) || 0;
        }

        return {
          title: getTag(item, "title") || "Untitled Episode",
          description: getTag(item, "description"),
          audio_url: audioUrl,
          file_size_bytes: parseInt(getAttr(item, "enclosure", "length") || "0"),
          duration_seconds: durationSeconds,
          pub_date: getTag(item, "pubDate") ? new Date(getTag(item, "pubDate")).toISOString() : null,
          episode_number: parseInt(getTag(item, "itunes:episode")) || null,
          season_number: parseInt(getTag(item, "itunes:season")) || null,
          guid: getTag(item, "guid") || null,
        };
      })
      .filter(Boolean);

    console.log(`Parsed ${episodes.length} episodes`);

    // Check if already imported
    const { data: existingPodcast } = await supabase
      .from("podcasts")
      .select("id")
      .eq("rss_feed_url", rssUrl)
      .eq("user_id", user.user.id)
      .maybeSingle();

    if (existingPodcast) {
      return new Response(
        JSON.stringify({ error: "Podcast already imported" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Insert podcast (matches actual DB schema)
    const { data: podcast, error: podcastError } = await supabase
      .from("podcasts")
      .insert({
        user_id: user.user.id,
        title: podcastMeta.title,
        description: podcastMeta.description,
        image_url: podcastMeta.image_url,
        author: podcastMeta.author,
        author_email: podcastMeta.author_email,
        website_url: podcastMeta.website_url,
        language: podcastMeta.language,
        category: podcastMeta.category,
        is_explicit: podcastMeta.is_explicit,
        rss_feed_url: rssUrl,
        status: "active",
      })
      .select()
      .single();

    if (podcastError) throw podcastError;

    // Insert rss_imports record
    await supabase.from("rss_imports").insert({
      user_id: user.user.id,
      podcast_id: podcast.id,
      rss_url: rssUrl,
      status: "completed",
      episodes_imported: episodes.length,
    });

    // Insert episodes
    if (episodes.length > 0) {
      const { error: epError } = await supabase.from("episodes").insert(
        episodes.map((ep: any) => ({
          podcast_id: podcast.id,
          user_id: user.user.id,
          title: ep.title,
          description: ep.description,
          audio_url: ep.audio_url,
          file_size_bytes: ep.file_size_bytes,
          duration_seconds: ep.duration_seconds,
          pub_date: ep.pub_date,
          episode_number: ep.episode_number,
          season_number: ep.season_number,
          guid: ep.guid,
          status: "published",
        })),
      );
      if (epError) console.error("Episode insert error:", epError);
    }

    return new Response(
      JSON.stringify({ podcast, episodes, episodeCount: episodes.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("RSS import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
