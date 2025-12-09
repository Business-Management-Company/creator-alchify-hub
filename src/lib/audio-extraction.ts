// Audio extraction utility using Web Audio API
// Extracts audio from video files client-side before transcription

export interface AudioExtractionResult {
  audioBlob: Blob;
  duration: number;
  sizeBytes: number;
}

// Maximum file size for Whisper API (25MB)
const MAX_WHISPER_SIZE = 25 * 1024 * 1024;

// Calculate optimal sample rate based on duration to stay under 25MB
// WAV file size = duration * sampleRate * bytesPerSample * channels + 44 (header)
// For 25MB limit with 16-bit mono: sampleRate = (25MB - 44) / (duration * 2)
function getOptimalSampleRate(durationSeconds: number): number {
  // Target ~22MB to have some buffer
  const targetSize = 22 * 1024 * 1024;
  const bytesPerSample = 2; // 16-bit
  const channels = 1; // mono
  
  const maxSampleRate = Math.floor((targetSize - 44) / (durationSeconds * bytesPerSample * channels));
  
  // Common speech recognition sample rates (choose the highest that fits)
  const validRates = [8000, 11025, 12000, 16000, 22050, 24000, 44100];
  
  // Find the highest rate that's under our max
  let optimalRate = 8000; // minimum fallback
  for (const rate of validRates) {
    if (rate <= maxSampleRate) {
      optimalRate = rate;
    }
  }
  
  console.log(`Video duration: ${durationSeconds}s, optimal sample rate: ${optimalRate}Hz (max allowed: ${maxSampleRate}Hz)`);
  
  return optimalRate;
}

export async function extractAudioFromVideo(
  videoUrl: string,
  onProgress?: (progress: number) => void
): Promise<AudioExtractionResult> {
  return new Promise((resolve, reject) => {
    // Create a video element to load the video
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    
    video.onloadedmetadata = async () => {
      const duration = video.duration;
      
      // Calculate optimal sample rate based on duration
      const sampleRate = getOptimalSampleRate(duration);
      const numberOfChannels = 1; // Mono is fine for transcription
      
      console.log(`Extracting audio: ${duration.toFixed(1)}s at ${sampleRate}Hz`);
      
      // Create an OfflineAudioContext for rendering
      const offlineContext = new OfflineAudioContext(
        numberOfChannels,
        Math.ceil(duration * sampleRate),
        sampleRate
      );
      
      // Create audio context for decoding
      const audioContext = new AudioContext();
      
      try {
        // Fetch the video as array buffer
        onProgress?.(10);
        const response = await fetch(videoUrl);
        const arrayBuffer = await response.arrayBuffer();
        
        onProgress?.(30);
        
        // Decode the audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        onProgress?.(50);
        
        // Create a buffer source for offline rendering
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start(0);
        
        // Render the audio
        const renderedBuffer = await offlineContext.startRendering();
        
        onProgress?.(70);
        
        // Convert to WAV format
        const wavBlob = audioBufferToWav(renderedBuffer);
        
        onProgress?.(90);
        
        // Cleanup
        audioContext.close();
        
        onProgress?.(100);
        
        console.log(`Extracted audio: ${(wavBlob.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Final size check
        if (wavBlob.size > MAX_WHISPER_SIZE) {
          reject(new Error(`Audio file is still too large (${(wavBlob.size / 1024 / 1024).toFixed(1)}MB). Video may be too long. Maximum supported duration is approximately 20 minutes.`));
          return;
        }
        
        resolve({
          audioBlob: wavBlob,
          duration,
          sizeBytes: wavBlob.size,
        });
      } catch (error) {
        audioContext.close();
        reject(new Error(`Failed to extract audio: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video for audio extraction'));
    };
    
    video.src = videoUrl;
    video.load();
  });
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);
  
  // WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  
  // Write audio data
  const channelData = buffer.getChannelData(0);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    // Clamp and convert to 16-bit integer
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Check if audio extraction is needed based on file size
export function needsAudioExtraction(fileSizeBytes: number): boolean {
  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
  return fileSizeBytes > MAX_SIZE;
}

// Estimate compressed audio size (rough approximation)
export function estimateAudioSize(durationSeconds: number, bitrateKbps: number = 128): number {
  return (durationSeconds * bitrateKbps * 1000) / 8;
}

// Check if video is too long to process (over ~20 minutes at minimum quality)
export function isVideoTooLong(durationSeconds: number): boolean {
  // At 8kHz (minimum), we can support up to about 1562 seconds (~26 minutes)
  // To be safe, limit to 20 minutes
  return durationSeconds > 1200;
}
