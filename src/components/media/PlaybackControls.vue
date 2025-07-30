<template>
  <div 
    class="flex items-center justify-between py-1 px-2 rounded-full bg-gray-200 dark:bg-gray-700/50 text-gray-800 dark:text-white" 
    style="height: 28px; min-width: 90px;"
  >
    <button 
      @click="onPlayPause" 
      class="flex items-center gap-1 py-1 px-1.5 rounded-full hover:bg-gray-300 dark:hover:bg-white/10 transition-colors"
      :class="{ 'text-blue-600 dark:text-blue-400': isPlaying }"
      :aria-label="isPlaying ? 'Pause playback' : 'Start playback'"
    >
      <Icon v-if="!isPlaying" name="play" :size="16" />
      <Icon v-else name="pause" :size="16" />
      <span class="text-xs opacity-80">{{ displayTime }}</span>
    </button>
    
    <div class="flex items-center">
      <button 
        @click="onNewRecording" 
        class="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-white/10 transition-colors"
        aria-label="Record new audio"
      >
        <Icon name="mic" :size="16" />
      </button>
      <button 
        @click="onDelete" 
        class="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-white/10 transition-colors text-red-500"
        aria-label="Delete recording"
      >
        <Icon name="trash" :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../ui/Icon.vue';
import { formatDuration } from '../../utils/audioHelpers';

// Props
const props = defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  },
  duration: {
    type: Number,
    default: 0
  },
  remainingTime: {
    type: Number,
    default: null
  }
});

// Emit events
const emit = defineEmits(['play-pause', 'new-recording', 'delete']);

// Computed time display
const displayTime = computed(() => {
  if (props.isPlaying && props.remainingTime !== null) {
    return formatDuration(props.remainingTime);
  }
  return formatDuration(props.duration);
});

// Event handlers
const onPlayPause = () => {
  emit('play-pause');
};

const onNewRecording = () => {
  emit('new-recording');
};

const onDelete = () => {
  emit('delete');
};
</script> 