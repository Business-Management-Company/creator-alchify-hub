import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rssUrl } = await req.json();
    
    if (!rssUrl) {
      return new Response(
        JSON.stringify({ error: "RSS URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching RSS feed from:", rssUrl);

    // Fetch RSS feed
    const response = await fetch(rssUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS feed: ${response.statusText}`);
    }

    const rssText = await response.text();

    // Helper function to strip HTML tags
    const stripHtml = (text: string): string => {
      return text
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
        .replace(/&amp;/g, '&') // Replace &amp; with &
        .replace(/&lt;/g, '<') // Replace &lt; with <
        .replace(/&gt;/g, '>') // Replace &gt; with >
        .replace(/&quot;/g, '"') // Replace &quot; with "
        .trim();
    };

    // Helper function to extract text between XML tags
    const getTagContent = (text: string, tagName: string): string => {
      const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i");
      const match = text.match(pattern);
      return match ? stripHtml(match[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")) : "";
    };

    // Helper function to get attribute value
    const getTagAttribute = (text: string, tagName: string, attrName: string): string => {
      const pattern = new RegExp(`<${tagName}[^>]*${attrName}=["']([^"']*)["']`, "i");
      const match = text.match(pattern);
      return match ? match[1] : "";
    };

    // Extract channel content
    const channelMatch = rssText.match(/<channel>([\s\S]*?)<\/channel>/i);
    if (!channelMatch) {
      throw new Error("Invalid RSS feed - no channel element found");
    }
    const channelContent = channelMatch[1];

    // Parse podcast metadata (camelCase for frontend)
    const podcast = {
      title: getTagContent(channelContent, "title"),
      description: getTagContent(channelContent, "description"),
      language: getTagContent(channelContent, "language") || "en",
      author: getTagContent(channelContent, "itunes:author"),
      authorEmail: getTagContent(channelContent, "itunes:email"),
      websiteUrl: getTagContent(channelContent, "link"),
      category: getTagAttribute(channelContent, "itunes:category", "text"),
      isExplicit: getTagContent(channelContent, "itunes:explicit").toLowerCase() === "yes",
      imageUrl: 
        getTagAttribute(channelContent, "itunes:image", "href") ||
        getTagContent(channelContent, "url"),
    };

    console.log("Parsed podcast:", podcast.title);

    // Parse episodes
    const itemMatches = [...channelContent.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    const episodes = itemMatches.map((match) => {
      const itemContent = match[1];
      
      const audioUrl = getTagAttribute(itemContent, "enclosure", "url");
      const fileSize = parseInt(getTagAttribute(itemContent, "enclosure", "length") || "0");
      
      const duration = getTagContent(itemContent, "itunes:duration");
      
      // Parse duration (can be HH:MM:SS, MM:SS, or seconds)
      let durationSeconds = 0;
      if (duration) {
        const parts = duration.split(":").map(Number);
        if (parts.length === 3) {
          durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          durationSeconds = parts[0] * 60 + parts[1];
        } else {
          durationSeconds = parseInt(duration) || 0;
        }
      }

      return {
        title: getTagContent(itemContent, "title"),
        description: getTagContent(itemContent, "description"),
        audioUrl: audioUrl,
        fileSizeBytes: fileSize,
        durationSeconds: durationSeconds,
        pubDate: getTagContent(itemContent, "pubDate"),
        episodeNumber: parseInt(getTagContent(itemContent, "itunes:episode")) || null,
        seasonNumber: parseInt(getTagContent(itemContent, "itunes:season")) || null,
        guid: getTagContent(itemContent, "guid"),
      };
    }).filter(ep => ep.audioUrl); // Only include episodes with audio

    console.log(`Parsed ${episodes.length} episodes`);

    return new Response(
      JSON.stringify({ podcast, episodes }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("RSS Import Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
