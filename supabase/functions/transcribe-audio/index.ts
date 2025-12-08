import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WordSegment {
  word: string;
  start: number;
  end: number;
}

interface TranscriptSegment {
  timestamp: string;
  text: string;
  start: number;
  end: number;
  words: WordSegment[];
}

// Maximum file size for direct processing (25MB - Whisper's limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let projectId: string | null = null;
  
  try {
    const body = await req.json();
    projectId = body.projectId;
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Starting transcription for project: ${projectId}`);

    // Get the project to find the audio file
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectError?.message}`);
    }

    // Check file size before processing
    const fileSize = project.source_file_size || 0;
    console.log(`File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    
    if (fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large for transcription. Maximum size is 25MB. Your file is ${(fileSize / 1024 / 1024).toFixed(1)}MB. Please upload a smaller file or compress your audio/video.`);
    }

    // Get signed URL for the audio file
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from('media-uploads')
      .createSignedUrl(project.source_file_url, 3600);

    if (urlError || !signedUrlData?.signedUrl) {
      throw new Error(`Failed to get file URL: ${urlError?.message}`);
    }

    console.log('Got signed URL for media file');

    // Update project status to transcribing
    await supabase
      .from('projects')
      .update({ status: 'transcribing' })
      .eq('id', projectId);

    // Stream the audio file in chunks to avoid memory issues
    console.log('Downloading audio file...');
    const audioResponse = await fetch(signedUrlData.signedUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }
    
    // Get content type and determine extension
    const contentType = audioResponse.headers.get('content-type') || 'video/mp4';
    let extension = 'mp4';
    if (contentType.includes('audio/')) {
      extension = contentType.split('/')[1].split(';')[0];
    } else if (contentType.includes('video/')) {
      extension = contentType.split('/')[1].split(';')[0];
    }
    // Handle webm
    if (extension === 'webm') extension = 'webm';
    
    console.log(`Content type: ${contentType}, extension: ${extension}`);

    // Read the response as array buffer (more memory efficient than blob for smaller files)
    const audioArrayBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioArrayBuffer], { type: contentType });
    
    console.log(`Audio file ready: ${audioBlob.size} bytes`);

    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    formData.append('file', audioBlob, `audio.${extension}`);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    formData.append('timestamp_granularities[]', 'segment');

    console.log('Sending to OpenAI Whisper for transcription with word-level timestamps...');

    // Call OpenAI Whisper API with word-level timestamps
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Whisper API error:", whisperResponse.status, errorText);
      throw new Error(`Whisper transcription failed: ${whisperResponse.status} - ${errorText}`);
    }

    const whisperResult = await whisperResponse.json();
    console.log('Whisper transcription complete');
    console.log(`Total duration: ${whisperResult.duration}s`);
    console.log(`Segments: ${whisperResult.segments?.length || 0}`);
    console.log(`Words: ${whisperResult.words?.length || 0}`);

    // Process the transcript with word-level timing
    const words: WordSegment[] = (whisperResult.words || []).map((w: any) => ({
      word: w.word,
      start: w.start,
      end: w.end,
    }));

    // Create segments from Whisper segments with associated words
    const segments: TranscriptSegment[] = (whisperResult.segments || []).map((seg: any) => {
      // Get words that fall within this segment's time range
      const segmentWords = words.filter(
        (w) => w.start >= seg.start && w.end <= seg.end + 0.5
      );
      
      const minutes = Math.floor(seg.start / 60);
      const seconds = Math.floor(seg.start % 60);
      const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return {
        timestamp,
        text: seg.text.trim(),
        start: seg.start,
        end: seg.end,
        words: segmentWords,
      };
    });

    // Build the formatted transcript content with timestamps
    let transcriptContent = '';
    for (const segment of segments) {
      transcriptContent += `[${segment.timestamp}] ${segment.text}\n`;
    }

    // Count filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so,', 'well,'];
    let fillerCount = 0;
    
    fillerWords.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = transcriptContent.match(regex);
      if (matches) {
        fillerCount += matches.length;
      }
    });

    // Count words
    const wordCount = words.length;

    // Calculate average confidence if available
    const avgConfidence = whisperResult.segments?.length > 0
      ? whisperResult.segments.reduce((acc: number, seg: any) => acc + (seg.avg_logprob || -0.5), 0) / whisperResult.segments.length
      : -0.5;
    
    // Convert log prob to confidence (rough approximation)
    const confidenceScore = Math.min(0.99, Math.max(0.5, 1 + avgConfidence * 0.5));

    // Save transcript to database with word-level data
    const { data: transcript, error: transcriptError } = await supabase
      .from('transcripts')
      .insert({
        project_id: projectId,
        content: transcriptContent,
        segments: segments, // Now includes word-level timing
        avg_confidence: confidenceScore,
        word_count: wordCount,
        filler_words_detected: fillerCount,
      })
      .select()
      .single();

    if (transcriptError) {
      throw new Error(`Failed to save transcript: ${transcriptError.message}`);
    }

    // Update project status to editing
    await supabase
      .from('projects')
      .update({ status: 'editing' })
      .eq('id', projectId);

    console.log('Transcription complete:', { 
      wordCount, 
      fillerCount, 
      segments: segments.length,
      hasWordTiming: words.length > 0
    });

    return new Response(
      JSON.stringify({
        success: true,
        transcript: {
          id: transcript.id,
          content: transcriptContent,
          wordCount,
          fillerCount,
          segmentCount: segments.length,
          hasWordTiming: true,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Transcription error:", error);
    
    // Try to update project status back to uploaded
    if (projectId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase
          .from('projects')
          .update({ status: 'uploaded' })
          .eq('id', projectId);
      } catch (e) {
        console.error("Failed to reset project status:", e);
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
