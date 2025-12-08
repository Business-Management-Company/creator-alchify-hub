// Audio extraction utility using Web Audio API
// Extracts audio from video files client-side before transcription

export interface AudioExtractionResult {
  audioBlob: Blob;
  duration: number;
  sizeBytes: number;
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
      const sampleRate = 16000; // 16kHz is good for speech recognition
      const numberOfChannels = 1; // Mono is fine for transcription
      
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
