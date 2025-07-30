<template>
  <div class="relative">
    <!-- Recording UI -->
    <RecordButton 
      v-if="!recording && !audioData" 
        @click="startRecording" 
    />

    <!-- Recording Progress UI -->
    <RecordingProgress 
      v-if="recording" 
      :duration="duration"
      @stop="stopRecording"
    />

    <!-- Playback UI -->
    <PlaybackControls 
      v-if="audioData && !recording" 
      :is-playing="isPlaying"
      :duration="getAudioDuration"
      :remaining-time="remainingSeconds"
      @play-pause="togglePlayback"
      @new-recording="startRecording"
      @delete="confirmDelete"
    />
      </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { formatDuration, blobToDataURL } from '../../utils/audioHelpers';
import { 
  isNative, isAndroid, isIOS,
  startNativeRecording, startWebRecording, 
  stopNativeRecording, openAppSettings 
} from '../../utils/recorderPlatform';
import { 
  createAudioElement, preloadAudio, 
  fixAudioMimeType, cleanupAudio 
} from '../../utils/audioPlayback';
import RecordButton from './RecordButton.vue';
import RecordingProgress from './RecordingProgress.vue';
import PlaybackControls from './PlaybackControls.vue';
import { useAppConfirm } from '../../composables/useAppConfirm';
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps({
  initialAudioData: {
    type: Object,
    default: () => null
  },
  sectionId: {
    type: [String, Number],
    required: true
  }
});

const emit = defineEmits(['save-recording', 'delete-recording']);

// Composables
const { confirmDelete: showConfirmDialog } = useAppConfirm();

// State
const recording = ref(false);
const audioData = ref(props.initialAudioData);
const mediaRecorder = ref(null);
const audioChunks = ref([]);
const startTime = ref(null);
const duration = ref(0);
const recordedDuration = ref(0);
const isPlaying = ref(false);
const audioElement = ref(null);
const playbackTimer = ref(null);
const remainingSeconds = ref(0);
const errorMessage = ref(null);

// Watch for prop changes
watch(() => props.initialAudioData, (newValue) => {
  audio('Initial audio data changed:', newValue ? {
    id: newValue.id,
    timestamp: newValue.timestamp,
    duration: newValue.duration,
    hasDuration: 'duration' in newValue
  } : 'null');
  
  audioData.value = newValue;
  
  // Reset audio element if audio data changes
  if (audioElement.value && newValue !== audioData.value) {
    stopPlayback();
    audioElement.value = null;
  }
}, { deep: true, immediate: true });

// Get formatted audio duration
const getAudioDuration = computed(() => {
  if (!audioData.value) return 0;
  
  // Use recorded duration directly from audioData if available
  if (audioData.value.duration && 
      !isNaN(audioData.value.duration) && 
      isFinite(audioData.value.duration)) {
    return audioData.value.duration;
  }
  
  // Calculate duration from audio metadata as fallback
  if (audioElement.value && 
      audioElement.value.duration && 
      !isNaN(audioElement.value.duration) && 
      isFinite(audioElement.value.duration)) {
    return audioElement.value.duration;
  }
  
  return 0;
});

/**
 * Stop audio playback
 */
const stopPlayback = () => {
  if (!audioElement.value) return;
  
  try {
    clearInterval(playbackTimer.value);
    isPlaying.value = false;
    
    if (!audioElement.value.paused) {
      audioElement.value.pause();
    }
    audioElement.value.currentTime = 0;
  } catch (error) {
    audio('Error stopping playback:', error);
  }
};

/**
 * Show permission error and prompt to open settings
 */
const showPermissionErrorDialog = async (message) => {
  await showConfirmDialog({
    title: 'Microphone Permission Required',
    message: message || 'To create recordings, the app needs access to your microphone. Please enable this permission in your app settings.',
    confirmText: 'Go to Settings',
    cancelText: 'Cancel',
    onConfirm: async () => {
      const result = await openAppSettings();
      
      // Try to start recording again after a delay
      setTimeout(() => {
        startRecording();
      }, 500);
    }
  });
};

/**
 * Start audio recording
 */
const startRecording = async () => {
  try {
    errorMessage.value = null;
    duration.value = 0;
    recordedDuration.value = 0;
    
    // Reset existing audio if present
    if (audioData.value) {
      if (isPlaying.value) {
        stopPlayback();
      }
      audioData.value = null;
      audioElement.value = null;
      emit('delete-recording');
    }

    // Start the timer for recording duration display
    startTime.value = Date.now();
    recording.value = true;
    
    // Update duration every 100ms for smoother display
    const durationInterval = setInterval(() => {
      if (recording.value) {
        duration.value = (Date.now() - startTime.value) / 1000;
      } else {
        clearInterval(durationInterval);
      }
    }, 100);

    if (isNative) {
      // Use native recording module
      const result = await startNativeRecording();
      
      if (!result.success) {
        audio('Native recording failed:', result.error, result.message);
        recording.value = false;
        clearInterval(durationInterval);
        
        if (result.error === 'permission_denied') {
          showPermissionErrorDialog('To create recordings, the app needs access to your microphone.');
          } else {
          errorMessage.value = result.message || 'An error occurred while starting the recording.';
        }
      }
    } else {
      // Web recording
      const result = await startWebRecording();
      
      if (!result.success) {
        audio('Web recording failed:', result.error, result.message);
        recording.value = false;
        clearInterval(durationInterval);
        
        showPermissionErrorDialog(result.message);
        return;
      }
      
      // Setup web MediaRecorder
      mediaRecorder.value = result.mediaRecorder;
      const stream = result.stream;
      const mimeType = result.mimeType;
    
    audioChunks.value = [];
    
    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.value.push(event.data);
      }
    };
    
    mediaRecorder.value.onerror = (event) => {
      audio('MediaRecorder error:', event);
          errorMessage.value = 'An error occurred during recording.';
      stopRecording();
    };
    
    mediaRecorder.value.start(500);
        
    mediaRecorder.value.onstop = async () => {
      if (audioChunks.value.length === 0) {
        return;
      }
      
      const endTime = Date.now();
      const actualDuration = (endTime - startTime.value) / 1000;
      recordedDuration.value = actualDuration;
      
      audio('Recording stopped, actual duration:', actualDuration, 'seconds');
      
      const audioBlob = new Blob(audioChunks.value, { type: mimeType });
      
      try {
          // Convert Blob to data URL and create audio data object
        const dataUrl = await blobToDataURL(audioBlob);
            const finalDuration = Math.max(0.1, actualDuration);
        
        audioData.value = {
          id: Date.now(),
          data: dataUrl,
          timestamp: new Date().toISOString(),
          duration: finalDuration
        };
        
        audio('Saving recording with duration:', finalDuration);
        emit('save-recording', audioBlob, { duration: finalDuration });
      
          // Clean up media stream
      stream.getTracks().forEach(track => track.stop());
        } catch (error) {
          audio('Error processing recording:', error);
          errorMessage.value = 'Error processing recording.';
        }
      };
    }
  } catch (generalError) {
    audio('General recording error:', generalError);
    recording.value = false;
    errorMessage.value = 'An error occurred while starting the recording.';
    
    showPermissionErrorDialog(`An error occurred: ${generalError.message}`);
  }
};

/**
 * Stop the active recording
 */
const stopRecording = async () => {
  if (!recording.value) return;
  
  // Set recording to false before actually stopping,
  // to enable immediate UI updates
  recording.value = false;
  
  try {
    if (isNative) {
      audio('Stopping native recording...',8225);
      
      const result = await stopNativeRecording(startTime.value);
      
      if (!result.success) {
        audio('Error stopping native recording:', result.error, result.message);
        errorMessage.value = 'Error stopping recording.';
        return;
      }
      
      // Create audio data object
        audioData.value = {
          id: Date.now(),
        data: result.dataUrl,
          timestamp: new Date().toISOString(),
        duration: result.duration
      };
      
      // Emit recording data to parent
      try {
        const response = await fetch(result.dataUrl);
          const audioBlob = await response.blob();
          emit('save-recording', audioBlob, { 
          duration: result.duration,
          dataUrl: result.dataUrl
          });
        } catch (blobError) {
        audio('Error converting to blob, using base64 directly:', blobError);
        // Emit base64 data directly
          emit('save-recording', { 
            type: 'audio/mpeg', 
          base64: result.base64Audio 
          }, { 
          duration: result.duration,
          dataUrl: result.dataUrl
          });
        }
        
      // Prepare audio for playback
        setTimeout(() => {
          if (audioData.value && audioData.value.data) {
          audioElement.value = createAudioElement(audioData.value.data);
          if (audioElement.value) {
            preloadAudio(audioElement.value);
          }
        }
      }, 300);
    } else {
      // Web MediaRecorder
      if (mediaRecorder.value) {
    try {
      mediaRecorder.value.stop();
          audio('Web recording stopped',9862);
    } catch (error) {
          audio('Error stopping web recording:', error);
          errorMessage.value = 'Error stopping web recording.';
        }
      }
    }
  } catch (error) {
    audio('General error during stopping:', error);
    errorMessage.value = 'Error stopping recording.';
  }
};

/**
 * Toggle playback of recorded audio
 */
const togglePlayback = async () => {
  if (!audioData.value || !audioData.value.data) {
    audio('No audio data available for playback',10338);
    return;
  }
  
  if (!audioElement.value) {
    audio('Creating new audio element for playback',10444);
    audioElement.value = createAudioElement(audioData.value.data);
  }
  
  try {
    if (isPlaying.value) {
      audio('Pausing playback',10615);
      audioElement.value.pause();
      isPlaying.value = false;
      clearInterval(playbackTimer.value);
    } else {
      audio('Starting playback',10774);
      await audioElement.value.play();
        isPlaying.value = true;
        
      // Get audio duration
      const audioDuration = audioElement.value.duration || audioData.value.duration || 0;
      remainingSeconds.value = audioDuration;
      
      // Start timer to update remaining time
        playbackTimer.value = setInterval(() => {
        if (!isPlaying.value || !audioElement.value) {
            clearInterval(playbackTimer.value);
            return;
          }
          
        remainingSeconds.value = Math.max(0, audioDuration - audioElement.value.currentTime);
        
        if (remainingSeconds.value <= 0) {
          clearInterval(playbackTimer.value);
          isPlaying.value = false;
            }
            }, 100);
      
      // Listen for the end of playback to reset playing state
      audioElement.value.onended = () => {
        audio('Playback ended',11684);
    isPlaying.value = false;
        clearInterval(playbackTimer.value);
      };
    }
  } catch (error) {
    audio('Error during playback:', error);
  isPlaying.value = false;
  }
};

/**
 * Show delete confirmation dialog
 */
const confirmDelete = async () => {
  await showConfirmDialog({
    title: 'Delete Recording',
    message: 'This recording will be permanently deleted.',
    confirmText: 'Delete',
    type: 'danger',
    onConfirm: () => {
  stopPlayback();
  audioData.value = null;
      cleanupAudio(audioElement.value);
  audioElement.value = null;
  errorMessage.value = null;
  emit('delete-recording');
    }
  });
};

// Lifecycle hooks
onBeforeUnmount(() => {
  stopPlayback();
  
  if (recording.value) {
    try {
      if (isNative) {
        // Make sure to stop the native recording if active
        VoiceRecorder.stopRecording();
      } else if (mediaRecorder.value) {
        // Stop web recording
    stopRecording();
      }
    } catch (error) {
      audio('Error stopping recording on unmount:', error);
    }
  }
  
  cleanupAudio(audioElement.value);
});

// Initial setup
onMounted(() => {
  audio('AudioRecorder mounted, platform:', Capacitor.getPlatform());
  
  // Initialize with existing audio data if provided
  if (props.initialAudioData && props.initialAudioData.data) {
    audio('Initializing with existing audio data',13039);
    
    try {
      // Ensure audio data is properly formatted
    audioData.value = { 
      ...props.initialAudioData,
        // Ensure duration is a valid number
        duration: !isNaN(props.initialAudioData.duration) ? 
          props.initialAudioData.duration : 0
      };
      
      // Fix MIME type if needed
      audioData.value.data = fixAudioMimeType(audioData.value.data);
      
      // Create and preload audio element
      setTimeout(() => {
        if (audioData.value && audioData.value.data) {
          audioElement.value = createAudioElement(audioData.value.data);
          
          if (audioElement.value) {
            // Add metadata loaded event to update duration if needed
          audioElement.value.onloadedmetadata = () => {
            audio('Initial audio metadata loaded:', audioElement.value.duration);
            
              // Update duration if needed
            if ((!audioData.value.duration || audioData.value.duration <= 0) && 
                audioElement.value.duration && 
                !isNaN(audioElement.value.duration)) {
              audio('Updating audio duration from metadata:', audioElement.value.duration);
              audioData.value.duration = audioElement.value.duration;
            }
          };
          
            preloadAudio(audioElement.value);
          }
        }
      }, 300);
    } catch (error) {
      audio('Error initializing audio data:', error);
    }
  }
});
</script>

<style scoped>
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style> 