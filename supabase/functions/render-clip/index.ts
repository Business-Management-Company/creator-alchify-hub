import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Shotstack API endpoints
const SHOTSTACK_API_URL = "https://api.shotstack.io/stage/render";
const SHOTSTACK_STATUS_URL = "https://api.shotstack.io/stage/render";

interface ClipRequest {
  videoUrl: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  title: string;
  platform: 'tiktok' | 'reels' | 'shorts' | 'landscape';
  captions?: { start: number; end: number; text: string }[];
}

// Platform dimensions
const PLATFORM_CONFIGS = {
  tiktok: { width: 1080, height: 1920, fps: 30 },
  reels: { width: 1080, height: 1920, fps: 30 },
  shorts: { width: 1080, height: 1920, fps: 30 },
  landscape: { width: 1920, height: 1080, fps: 30 },
};

function buildShotstackTimeline(request: ClipRequest) {
  const config = PLATFORM_CONFIGS[request.platform];
  const duration = request.endTime - request.startTime;

  // Build caption clips if provided
  const captionClips = request.captions?.map((caption) => ({
    asset: {
      type: "title",
      text: caption.text,
      style: "subtitle",
      size: "medium",
      background: "#000000AA",
      position: "bottom",
    },
    start: caption.start - request.startTime,
    length: caption.end - caption.start,
    fit: "none",
    position: "bottom",
  })) || [];

  return {
    timeline: {
      soundtrack: {
        src: request.videoUrl,
        effect: "fadeOut",
      },
      tracks: [
        {
          clips: captionClips,
        },
        {
          clips: [
            {
              asset: {
                type: "video",
                src: request.videoUrl,
                trim: request.startTime,
                volume: 1,
              },
              start: 0,
              length: duration,
              fit: "crop",
              scale: 1,
            },
          ],
        },
      ],
    },
    output: {
      format: "mp4",
      resolution: "1080",
      aspectRatio: request.platform === 'landscape' ? "16:9" : "9:16",
      size: {
        width: config.width,
        height: config.height,
      },
      fps: config.fps,
    },
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SHOTSTACK_API_KEY = Deno.env.get("SHOTSTACK_API_KEY");
    if (!SHOTSTACK_API_KEY) {
      throw new Error("SHOTSTACK_API_KEY is not configured");
    }

    const { action, ...params } = await req.json();

    if (action === 'render') {
      const clipRequest = params as ClipRequest;
      
      console.log(`Rendering clip: ${clipRequest.title} (${clipRequest.platform})`);
      console.log(`Time range: ${clipRequest.startTime}s - ${clipRequest.endTime}s`);

      const timeline = buildShotstackTimeline(clipRequest);

      const response = await fetch(SHOTSTACK_API_URL, {
        method: "POST",
        headers: {
          "x-api-key": SHOTSTACK_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(timeline),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Shotstack render error:", errorText);
        throw new Error(`Shotstack API error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Render job created:", data.response.id);

      return new Response(
        JSON.stringify({
          success: true,
          renderId: data.response.id,
          message: data.response.message,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'status') {
      const { renderId } = params;
      
      console.log(`Checking render status: ${renderId}`);

      const response = await fetch(`${SHOTSTACK_STATUS_URL}/${renderId}`, {
        method: "GET",
        headers: {
          "x-api-key": SHOTSTACK_API_KEY,
        },
      });

      if (!response.ok) {
        throw new Error(`Shotstack status error: ${response.status}`);
      }

      const data = await response.json();
      const render = data.response;

      return new Response(
        JSON.stringify({
          success: true,
          status: render.status,
          url: render.url || null,
          progress: render.status === 'rendering' ? 50 : render.status === 'done' ? 100 : 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else {
      throw new Error("Invalid action. Use 'render' or 'status'");
    }

  } catch (error) {
    console.error("Render clip error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});