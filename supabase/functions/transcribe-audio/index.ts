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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

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
      const fileResponse = await fetch(project.source_file_url);
      if (!fileResponse.ok) throw new Error('Failed to download source file');
      audioBytes = new Uint8Array(await fileResponse.arrayBuffer());
      fileName = project.source_file_name || 'audio.mp3';
    } else {
      return new Response(JSON.stringify({ error: 'No audio source available' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call OpenAI Whisper API with verbose_json for segments
    const formData = new FormData();
    formData.append('file', new Blob([audioBytes]), fileName);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errText = await whisperResponse.text();
      console.error('OpenAI Whisper error:', errText);
      throw new Error(`Whisper transcription failed: ${whisperResponse.status}`);
    }

    const whisperResult = await whisperResponse.json();

    // Map Whisper segments to our format
    const segments = (whisperResult.segments || []).map((seg: any) => ({
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
      confidence: seg.avg_logprob ? Math.min(0.99, Math.max(0.5, 1 + seg.avg_logprob)) : 0.95,
    }));

    const fullText = whisperResult.text || '';
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;

    // Detect filler words
    const fillerPattern = /\b(um|uh|like|you know|so|basically|actually|literally|right|I mean)\b/gi;
    const fillerMatches = fullText.match(fillerPattern);
    const fillerWordsDetected = fillerMatches ? fillerMatches.length : 0;

    const avgConfidence = segments.length > 0
      ? segments.reduce((sum: number, s: any) => sum + s.confidence, 0) / segments.length
      : 0.95;

    // Save transcript
    const { error: transcriptError } = await supabase.from('transcripts').insert({
      project_id: projectId,
      content: fullText,
      segments,
      word_count: wordCount,
      filler_words_detected: fillerWordsDetected,
      avg_confidence: Math.round(avgConfidence * 1000) / 1000,
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
      action_details: { wordCount, fillerWordsDetected, avgConfidence, provider: 'openai-whisper' },
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
