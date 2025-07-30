import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'
/**
 * Audio playback utilities for handling audio elements and playback across platforms
 */

// Create and manage AudioContext instance
let audioContext = null;

/**
 * Create a new AudioContext, or return the existing one
 */
export const createAudioContext = () => {
  if (typeof window === 'undefined') return null;
  
  // Create AudioContext only once
  if (audioContext) return audioContext;
  
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      audio('AudioContext not supported in this browser',527);
      return null;
    }
    
    audioContext = new AudioContextClass();
    audio('AudioContext created:', audioContext.state);
    
    // Try to activate the AudioContext
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        audio('AudioContext activated',857);
      }).catch(err => {
        audio('Error activating AudioContext:', err);
      });
    }
    
    return audioContext;
  } catch (error) {
    audio('Error creating AudioContext:', error);
    return null;
  }
};

/**
 * Play audio directly from the base64 string using AudioContext API
 * This offers better compatibility with Android
 * @param {string} base64Audio - The base64 audio string or data URL
 */
export const playWithAudioContext = async (base64Audio) => {
  try {
    // Create AudioContext if not available
    const ctx = createAudioContext();
    if (!ctx) {
      audio('No AudioContext available, using standard method',1483);
      return false; // Audio context not available
    }
    
    // Activate AudioContext if needed (for iOS)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // Decode base64 data
    const base64Data = base64Audio.includes('base64,') 
      ? base64Audio.split('base64,')[1] 
      : base64Audio;
    
    // Convert Base64 to Binary Array
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    audio('Audio data decoded, length:', bytes.length);
    
    // Decode the audio data
    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    
    // Create source node from buffer
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to output
    source.connect(ctx.destination);
    
    // Start playback
    source.start(0);
    
    return {
      success: true,
      source,
      duration: audioBuffer.duration
    };
  } catch (error) {
    audio('Error playing with AudioContext:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create an audio element for playback
 * @param {string} audioSource - The audio source URL
 */
export const createAudioElement = (audioSource) => {
  if (!audioSource) {
    audio('No audio source provided for playback',2952);
    return null;
  }
  
  try {
    // Create a new Audio element
    const audioElement = new Audio(audioSource);
    audioElement.preload = 'auto';
    
    return audioElement;
  } catch (error) {
    audio('Error creating audio element:', error);
    return null;
  }
};

/**
 * Preload an audio element for faster playback
 * @param {HTMLAudioElement} audioElement - The audio element to preload
 */
export const preloadAudio = async (audioElement) => {
  if (!audioElement) return false;
  
  try {
    audioElement.load();
    
    // Manual preloading by briefly touching playback
    const playPromise = audioElement.play();
    
    if (playPromise !== undefined) {
      await playPromise;
      // Immediately pause to just load metadata
      audioElement.pause();
      audioElement.currentTime = 0;
      audio('Audio successfully preloaded, ready for playback',3827);
      return true;
    }
    
    return false;
  } catch (error) {
    audio('Error preloading audio:', error);
    return false;
  }
};

/**
 * Fix audio MIME type issues 
 * @param {string} dataUrl - The audio data URL
 */
export const fixAudioMimeType = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  
  // Fix common MIME type issues
  if (dataUrl.includes('audio/mp3')) {
    audio('Converting audio/mp3 MIME type to audio/mpeg for better compatibility',4307);
    return dataUrl.replace('audio/mp3', 'audio/mpeg');
  }
  
  return dataUrl;
};

/**
 * Safe cleanup for audio resources
 * @param {HTMLAudioElement} audioElement - The audio element to clean up
 */
export const cleanupAudio = (audioElement) => {
  if (!audioElement) return;
  
  try {
    if (!audioElement.paused) {
      audioElement.pause();
    }
    
    audioElement.src = '';
    
    // Add extra cleanup for memory management
    audioElement.load();
  } catch (error) {
    audio('Error cleaning up audio element:', error);
  }
}; 