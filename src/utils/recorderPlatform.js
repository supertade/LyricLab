import { Capacitor } from '@capacitor/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { getSupportedMimeType, blobToDataURL, getMicrophoneStream } from './audioHelpers';
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

// Platform detection helpers
export const isNative = Capacitor.getPlatform() !== 'web';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isIOS = Capacitor.getPlatform() === 'ios';

/**
 * Start recording on native platforms (iOS, Android)
 */
export const startNativeRecording = async () => {
  // For Android: Always try to start directly, without permission request
  audio('Trying to start recording directly...',594);
  
  try {
    // Start recording with explicit options
    await VoiceRecorder.startRecording({
      mimeType: 'audio/mpeg',
      bitRate: 128000,
      sampleRate: 44100
    });
    
    audio('Recording started successfully',839);
    return { success: true };
  } catch (directError) {
    audio('Direct start failed:', directError);
    
    // If direct start fails, we try with a permission request
    try {
      const permStatus = await VoiceRecorder.requestPermissions();
      audio('Permission request result:', permStatus);
      
      if (permStatus.value === 'granted') {
        // Try starting the recording again
        await VoiceRecorder.startRecording({
          mimeType: 'audio/mpeg',
          bitRate: 128000,
          sampleRate: 44100
        });
        audio('Recording started after permission request',1439);
        return { success: true };
      } else {
        // If permission was denied, show the dialog
        return { 
          success: false, 
          error: 'permission_denied',
          message: 'Microphone permission denied'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: 'start_failed',
        message: error.message
      };
    }
  }
};

/**
 * Start recording on web platform
 */
export const startWebRecording = async () => {
  try {
    const stream = await getMicrophoneStream();
    const mimeType = getSupportedMimeType();
    
    const mediaRecorder = new MediaRecorder(stream, { 
      mimeType, 
      audioBitsPerSecond: 128000 
    });
    
    return {
      success: true,
      mediaRecorder,
      stream,
      mimeType
    };
  } catch (error) {
    let errorType = 'generic';
    let errorMessage = error.message;
    
    if (error.name === 'NotAllowedError') {
      errorType = 'permission_denied';
      errorMessage = 'Microphone access was denied. Please allow access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorType = 'not_found';
      errorMessage = 'No microphone found. Please make sure a microphone is connected.';
    }
    
    return {
      success: false,
      error: errorType,
      message: errorMessage
    };
  }
};

/**
 * Stop recording on native platforms and get the recording data
 * @param {number} startTimeMs - Recording start time in milliseconds
 */
export const stopNativeRecording = async (startTimeMs) => {
  try {
    // Use provided start time or fallback
    const recordingStartTime = startTimeMs || Date.now() - 1000;
    const result = await VoiceRecorder.stopRecording();
    
    audio('Recording result received:', typeof result, 
      result ? 'has value' : 'no value', 
      result && result.value ? 'Value is:' : 'no result.value');
    
    if (!result || !result.value) {
      return {
        success: false,
        error: 'no_data',
        message: 'No recording data received from device'
      };
    }
    
    // Calculate actual duration
    const endTime = Date.now();
    const actualDuration = Math.max(0.1, (endTime - recordingStartTime) / 1000);
    
    // Process the base64 data
    let base64Audio;
    const resultKeys = Object.keys(result.value);
    
    // Try different known keys or formats
    if (typeof result.value === 'string') {
      // Directly a string is likely the base64 audio
      base64Audio = result.value;
    } else if (result.value.recordDataBase64) {
      // Capacitor VoiceRecorder 4.x format
      base64Audio = result.value.recordDataBase64;
    } else if (result.value.value) {
      // Nested value
      base64Audio = result.value.value;
    } else if (resultKeys.length > 0) {
      // Try the first available key
      base64Audio = result.value[resultKeys[0]];
    } else {
      return {
        success: false,
        error: 'unknown_format',
        message: 'Could not determine base64 audio format'
      };
    }
    
    if (typeof base64Audio !== 'string') {
      return {
        success: false,
        error: 'invalid_format',
        message: 'Base64 Audio is not a string'
      };
    }
    
    // Create the data URL
    const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;
    
    return {
      success: true,
      dataUrl,
      base64Audio,
      duration: actualDuration
    };
  } catch (error) {
    return {
      success: false,
      error: 'stop_failed',
      message: error.message
    };
  }
};

/**
 * Open app settings to adjust permissions
 */
export const openAppSettings = async () => {
  try {
    if (isAndroid) {
      audio('Opening Android app settings...',5197);
      // Try multiple methods
      if (window.cordova && window.cordova.plugins && window.cordova.plugins.diagnostic) {
        // Try cordova-diagnostic-plugin if available
        window.cordova.plugins.diagnostic.switchToSettings();
        return true;
      } else {
        // Direct Intent-URL with window.open
        const packageName = 'app.settings'; // Standard app settings
        const url = `package:${packageName}`;
        
        if (window.open) {
          window.open(url);
          // Additional attempt for newer Android versions
          window.open('app-settings:');
          return true;
        }
      }
    } else if (isNative) {
      // iOS settings
      window.open('app-settings:');
      return true;
    }
    
    return false;
  } catch (error) {
    audio('Error opening settings:', error);
    return false;
  }
}; 