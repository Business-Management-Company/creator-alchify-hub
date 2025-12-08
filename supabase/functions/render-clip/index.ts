import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Shotstack API endpoints
const SHOTSTACK_API_URL = "https://api.shotstack.io/stage/render";
const SHOTSTACK_STATUS_URL = "https://api.shotstack.io/stage/render";

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface ClipRequest {
  videoUrl: string;
  startTime: number;
  endTime: number;
  title: string;
  platform: 'tiktok' | 'reels' | 'shorts' | 'landscape';
  captions?: CaptionSegment[];
  captionStyle?: {
    font?: string;
    color?: string;
    backgroundColor?: string;
    position?: 'top' | 'center' | 'bottom';
    size?: 'small' | 'medium' | 'large';
    animation?: 'fade' | 'slide' | 'pop' | 'karaoke';
  };
}

// Platform dimensions
const PLATFORM_CONFIGS = {
  tiktok: { width: 1080, height: 1920, fps: 30 },
  reels: { width: 1080, height: 1920, fps: 30 },
  shorts: { width: 1080, height: 1920, fps: 30 },
  landscape: { width: 1920, height: 1080, fps: 30 },
};

const FONT_SIZES = {
  small: 32,
  medium: 42,
  large: 54,
};

const POSITION_MAP = {
  top: 'top',
  center: 'center',
  bottom: 'bottom',
};

// Build animated caption clips
function buildCaptionClips(
  captions: CaptionSegment[], 
  clipStartTime: number,
  style: ClipRequest['captionStyle'] = {}
) {
  const {
    font = 'Montserrat ExtraBold',
    color = '#FFFFFF',
    backgroundColor = '#000000CC',
    position = 'bottom',
    size = 'medium',
    animation = 'pop',
  } = style;

  return captions.map((caption) => {
    const relativeStart = Math.max(0, caption.start - clipStartTime);
    const relativeEnd = caption.end - clipStartTime;
    const duration = relativeEnd - relativeStart;

    // Animation transitions based on style
    const transitions: any[] = [];
    
    switch (animation) {
      case 'fade':
        transitions.push(
          { in: 'fade', duration: 0.3 },
          { out: 'fade', duration: 0.3 }
        );
        break;
      case 'slide':
        transitions.push(
          { in: 'slideUp', duration: 0.3 },
          { out: 'slideDown', duration: 0.3 }
        );
        break;
      case 'pop':
        transitions.push(
          { in: 'zoom', duration: 0.2 },
          { out: 'fade', duration: 0.2 }
        );
        break;
      case 'karaoke':
        // Word-by-word highlight effect
        transitions.push(
          { in: 'fade', duration: 0.1 },
          { out: 'fade', duration: 0.1 }
        );
        break;
    }

    // Split text into lines for better readability (max 6 words per line)
    const words = caption.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach((word) => {
      if ((currentLine + ' ' + word).trim().split(' ').length <= 6) {
        currentLine = (currentLine + ' ' + word).trim();
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    
    const formattedText = lines.join('\n');

    return {
      asset: {
        type: 'html',
        html: `
          <div style="
            font-family: '${font}', sans-serif;
            font-size: ${FONT_SIZES[size]}px;
            font-weight: 800;
            color: ${color};
            text-align: center;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5);
            background: ${backgroundColor};
            padding: 12px 24px;
            border-radius: 8px;
            max-width: 90%;
            line-height: 1.3;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">
            ${formattedText.replace(/\n/g, '<br/>')}
          </div>
        `,
        width: 1000,
        height: 200,
      },
      start: relativeStart,
      length: Math.max(0.5, duration),
      position: POSITION_MAP[position],
      transition: transitions.length > 0 ? {
        in: transitions[0]?.in,
        out: transitions[1]?.out || transitions[0]?.out,
      } : undefined,
      effect: animation === 'karaoke' ? 'zoomIn' : undefined,
    };
  });
}

function buildShotstackTimeline(request: ClipRequest) {
  const config = PLATFORM_CONFIGS[request.platform];
  const duration = request.endTime - request.startTime;

  // Build caption clips with animations
  const captionClips = request.captions?.length 
    ? buildCaptionClips(request.captions, request.startTime, request.captionStyle)
    : [];

  console.log(`Building timeline with ${captionClips.length} caption clips`);

  const timeline: any = {
    timeline: {
      tracks: [],
    },
    output: {
      format: 'mp4',
      size: {
        width: config.width,
        height: config.height,
      },
      fps: config.fps,
    },
  };

  // Add caption track (top layer)
  if (captionClips.length > 0) {
    timeline.timeline.tracks.push({
      clips: captionClips,
    });
  }

  // Add video track (bottom layer)
  timeline.timeline.tracks.push({
    clips: [
      {
        asset: {
          type: 'video',
          src: request.videoUrl,
          trim: request.startTime,
          volume: 1,
        },
        start: 0,
        length: duration,
        fit: 'crop',
        scale: 1,
      },
    ],
  });

  return timeline;
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
      console.log(`Captions: ${clipRequest.captions?.length || 0} segments`);
      console.log(`Caption style:`, clipRequest.captionStyle);

      const timeline = buildShotstackTimeline(clipRequest);

      console.log('Shotstack payload:', JSON.stringify(timeline, null, 2));

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
        throw new Error(`Shotstack API error: ${response.status} - ${errorText}`);
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