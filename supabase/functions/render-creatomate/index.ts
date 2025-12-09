import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CREATOMATE_API_URL = 'https://api.creatomate.com/v1';

interface WordSegment {
  word: string;
  start: number;
  end: number;
}

interface RenderRequest {
  action: 'render' | 'status';
  renderId?: string;
  videoUrl?: string;
  words?: WordSegment[];
  platform?: 'tiktok' | 'reels' | 'shorts' | 'landscape';
  startTime?: number;
  endTime?: number;
  captionStyle?: {
    fontFamily?: string;
    fontSize?: number;
    textColor?: string;
    highlightColor?: string;
    backgroundColor?: string;
    position?: 'top' | 'center' | 'bottom';
  };
}

// Platform aspect ratios
const PLATFORM_CONFIGS = {
  tiktok: { width: 1080, height: 1920 },
  reels: { width: 1080, height: 1920 },
  shorts: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
};

// Build caption text with timing from word segments
function buildCaptionText(words: WordSegment[], startOffset: number): string {
  return words.map(w => ({
    ...w,
    start: w.start - startOffset,
    end: w.end - startOffset,
  })).map(w => w.word).join(' ');
}

// Get Y position based on position preference (as percentage for Creatomate)
function getYPosition(position: string): string {
  switch (position) {
    case 'top': return '15%';
    case 'center': return '50%';
    case 'bottom': 
    default: return '75%'; // Changed from 80% to 75% to ensure visibility
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CREATOMATE_API_KEY = Deno.env.get('CREATOMATE_API_KEY');
    if (!CREATOMATE_API_KEY) {
      console.error('CREATOMATE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Creatomate API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: RenderRequest = await req.json();
    console.log('Creatomate request:', JSON.stringify(body, null, 2));

    // Handle status check
    if (body.action === 'status') {
      if (!body.renderId) {
        return new Response(
          JSON.stringify({ error: 'renderId is required for status check' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Checking render status for:', body.renderId);
      const statusResponse = await fetch(`${CREATOMATE_API_URL}/renders/${body.renderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
        },
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Creatomate status error:', statusResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to check render status', details: errorText }),
          { status: statusResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const statusData = await statusResponse.json();
      console.log('Render status:', statusData);
      
      return new Response(
        JSON.stringify(statusData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle render request
    if (body.action === 'render') {
      const { videoUrl, words, platform = 'tiktok', startTime = 0, endTime, captionStyle = {} } = body;

      if (!videoUrl) {
        return new Response(
          JSON.stringify({ error: 'videoUrl is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const config = PLATFORM_CONFIGS[platform];
      const duration = endTime ? endTime - startTime : undefined;

      // Default caption styling
      const {
        fontFamily = 'Montserrat',
        fontSize = 80,
        textColor = '#FFFFFF',
        highlightColor = '#FFD700', // Gold highlight for active word
        backgroundColor = 'rgba(0,0,0,0.6)',
        position = 'bottom',
      } = captionStyle;

      // Build the Creatomate source with animated captions
      const source: any = {
        output_format: 'mp4',
        width: config.width,
        height: config.height,
        elements: [
          // Video element
          {
            type: 'video',
            source: videoUrl,
            trim_start: startTime,
            ...(duration && { duration }),
          },
        ],
      };

      // Add captions if words are provided
      if (words && words.length > 0) {
        const captionText = buildCaptionText(words, startTime);
        const yPos = getYPosition(position);

        // Creatomate transcript-style animated captions
        // Using percentage-based positioning for proper placement
        source.elements.push({
          type: 'text',
          transcript: captionText,
          transcript_effect: 'highlight', // Word-by-word highlight effect
          transcript_color: highlightColor,
          y: yPos, // Now percentage like "75%"
          width: '85%',
          x_alignment: '50%',
          y_alignment: '50%',
          font_family: fontFamily,
          font_weight: '800',
          font_size_maximum: `${fontSize} px`,
          fill_color: textColor,
          background_color: '#000000CC', // Solid black with transparency
          background_x_padding: '5%', // Use percentage, not pixels
          background_y_padding: '2%', // Use percentage, not pixels
          background_border_radius: '3%', // Use percentage, not pixels
          text_transform: 'uppercase',
          text_align: 'center',
          line_height: '120%',
          // Word timing from transcript
          transcript_words: words.map(w => ({
            word: w.word,
            start: w.start - startTime,
            end: w.end - startTime,
          })),
        });
      }

      console.log('Sending render request to Creatomate:', JSON.stringify(source, null, 2));

      const renderResponse = await fetch(`${CREATOMATE_API_URL}/renders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CREATOMATE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source }),
      });

      if (!renderResponse.ok) {
        const errorText = await renderResponse.text();
        console.error('Creatomate render error:', renderResponse.status, errorText);
        return new Response(
          JSON.stringify({ error: 'Failed to start render', details: errorText }),
          { status: renderResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const renderData = await renderResponse.json();
      console.log('Render started:', renderData);

      // Creatomate returns an array of renders
      const render = Array.isArray(renderData) ? renderData[0] : renderData;

      return new Response(
        JSON.stringify({
          success: true,
          renderId: render.id,
          status: render.status,
          url: render.url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "render" or "status"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Creatomate function error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});