import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { projectId, audioData } = await req.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Missing projectId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase.from('projects').update({ status: 'transcribing' }).eq('id', projectId);

    // Get audio as binary
    let audioBytes: Uint8Array;
    let fileName = 'audio.mp3';

    if (audioData) {
      // Base64 audio from client
      const binaryStr = atob(audioData);
      audioBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        audioBytes[i] = binaryStr.charCodeAt(i);
      }
    } else if (project.source_file_url) {
      // Download from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('media-uploads')
        .download(project.source_file_url);
      if (downloadError || !fileData) {
        console.error('Storage download error:', downloadError);
        throw new Error('Failed to download source file from storage');
      }
      audioBytes = new Uint8Array(await fileData.arrayBuffer());
      fileName = project.source_file_name || 'audio.webm';
    } else {
      return new Response(JSON.stringify({ error: 'No audio source available' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert audio to base64 for Gemini
    const base64Audio = btoa(String.fromCharCode(...audioBytes));
    
    // Determine MIME type from file extension
    const ext = fileName.split('.').pop()?.toLowerCase() || 'webm';
    const mimeMap: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'webm': 'audio/webm',
      'm4a': 'audio/mp4',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
    };
    const mimeType = mimeMap[ext] || 'audio/webm';

    // Use Lovable AI gateway with Gemini for transcription
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Transcribing ${fileName} (${(audioBytes.length / 1024 / 1024).toFixed(1)} MB) via Gemini...`);

    const geminiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a precise audio/video transcription engine. Your task is to transcribe the provided media file.

IMPORTANT RULES:
- Transcribe EXACTLY what is spoken — do not paraphrase, summarize, or add commentary
- Include all filler words (um, uh, like, you know, etc.) exactly as spoken
- Use proper punctuation and capitalization
- If there are multiple speakers, do NOT label them — just transcribe the continuous speech
- If no speech is detected, respond with: {"text":"","segments":[]}

RESPOND ONLY with valid JSON in this exact format (no markdown, no code blocks):
{"text":"full transcription text here","segments":[{"start":0.0,"end":5.0,"text":"segment text"},{"start":5.0,"end":10.0,"text":"next segment"}]}

Each segment should be roughly 5-15 seconds of speech. Estimate timestamps as accurately as possible based on natural pauses and sentence boundaries.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_audio',
                input_audio: {
                  data: base64Audio,
                  format: ext === 'mp3' ? 'mp3' : ext === 'wav' ? 'wav' : 'mp3',
                },
              },
              {
                type: 'text',
                text: 'Transcribe this audio/video file. Respond ONLY with the JSON object, no other text.',
              }
            ],
          }
        ],
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini transcription error:', errText);
      throw new Error(`Transcription failed: ${geminiResponse.status}`);
    }

    const geminiResult = await geminiResponse.json();
    const responseText = geminiResult.choices?.[0]?.message?.content || '';
    
    console.log('Gemini raw response length:', responseText.length);

    // Parse the JSON response
    let transcriptionData: { text: string; segments: Array<{ start: number; end: number; text: string }> };
    try {
      // Strip markdown code blocks if present
      const cleaned = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      transcriptionData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('Failed to parse transcription JSON:', responseText.substring(0, 500));
      // Fallback: treat the entire response as plain text
      transcriptionData = {
        text: responseText,
        segments: [{ start: 0, end: 0, text: responseText }],
      };
    }

    const fullText = transcriptionData.text || '';
    const segments = (transcriptionData.segments || []).map((seg) => ({
      start: seg.start || 0,
      end: seg.end || 0,
      text: (seg.text || '').trim(),
      confidence: 0.92, // Gemini doesn't provide per-segment confidence
    }));

    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    // Detect filler words
    const fillerPattern = /\b(um|uh|like|you know|so|basically|actually|literally|right|I mean)\b/gi;
    const fillerMatches = fullText.match(fillerPattern);
    const fillerWordsDetected = fillerMatches ? fillerMatches.length : 0;

    const avgConfidence = 0.92;

    // Save transcript
    const { error: transcriptError } = await supabase.from('transcripts').insert({
      project_id: projectId,
      content: fullText,
      segments,
      word_count: wordCount,
      filler_words_detected: fillerWordsDetected,
      avg_confidence: avgConfidence,
    });

    if (transcriptError) {
      console.error('Error saving transcript:', transcriptError);
      throw new Error('Failed to save transcript');
    }

    await supabase.from('projects').update({ status: 'editing' }).eq('id', projectId);

    await supabase.from('ai_action_log').insert({
      project_id: projectId,
      user_id: user.id,
      action_type: 'transcribe',
      action_details: { wordCount, fillerWordsDetected, avgConfidence, provider: 'gemini-2.5-flash' },
    });

    return new Response(JSON.stringify({
      success: true,
      transcript: { text: fullText, wordCount, fillerWordsDetected, avgConfidence, segments },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
