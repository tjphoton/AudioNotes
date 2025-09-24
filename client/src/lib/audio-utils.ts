export function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  return new AudioContextClass();
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function analyzeAudio(audioBuffer: AudioBuffer): { duration: number; sampleRate: number } {
  return {
    duration: audioBuffer.duration,
    sampleRate: audioBuffer.sampleRate,
  };
}

export async function convertBlobToWav(blob: Blob): Promise<Blob> {
  // If it's already a WAV, return as-is
  if (blob.type === 'audio/wav') {
    return blob;
  }

  // For other formats, we'll just return the blob as-is for now
  // In a real implementation, you might want to use a library like lamejs
  // to convert to WAV format
  return blob;
}

export function calculateFileSize(audioBlob: Blob): number {
  return audioBlob.size;
}

export function getAudioMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return 'audio/webm'; // fallback
}
