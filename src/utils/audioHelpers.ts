import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'
/**
 * Determines the best supported audio MIME type for recording
 * @returns Supported MIME type or empty string if none found
 */
export function getSupportedMimeType(): string {
  const types: string[] = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4;codecs=opus',
    'audio/mpeg'
  ];
  
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  
  return '';
}

/**
 * Formats seconds to MM:SS format
 * @param seconds - Seconds to format
 * @returns Formatted time string
 */
export function formatDuration(seconds: number): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Converts an audio Blob to a base64 data URL
 * @param audioBlob - The audio blob to convert
 * @returns Promise that resolves to a data URL
 */
export function blobToDataURL(audioBlob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!audioBlob) {
      reject(new Error('No audio blob provided'));
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result.toString());
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * Requests microphone access with optimal settings
 * @returns Promise that resolves to a media stream
 */
export async function getMicrophoneStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
  } catch (error) {
    audio('Error accessing microphone:', error);
    throw error;
  }
}

/**
 * Gets audio duration from a file or blob
 * @param source - Data URL or blob
 * @returns Promise that resolves to the duration in seconds
 */
export function getAudioDuration(source: string | Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    
    audio.onerror = () => {
      audio('Error loading audio for duration calculation',2509);
      resolve(0);
    };
    
    // Set the source - can be a data URL or blob URL
    if (typeof source === 'string') {
      audio.src = source;
    } else if (source instanceof Blob) {
      audio.src = URL.createObjectURL(source);
    }
  });
} 