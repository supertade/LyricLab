<template>
  <div 
    class="flex items-center justify-between py-1 px-2 rounded-full bg-red-200 dark:bg-red-500/20 text-gray-800 dark:text-white" 
    style="height: 28px; min-width: 90px;"
  >
    <div class="flex items-center gap-2">
      <div 
        class="w-2.5 h-2.5 rounded-full bg-red-500 animate-[blink_1s_infinite]" 
        role="status" 
        aria-label="Recording in progress"
      ></div>
      <span class="text-sm font-medium">{{ formattedDuration }}</span>
    </div>
    <button 
      @click="onStop" 
      class="p-1 rounded-full hover:bg-white/20 transition-colors"
      aria-label="Stop recording"
    >
      <Icon name="stop" :size="16" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../ui/Icon.vue';
import { formatDuration } from '../../utils/audioHelpers';

// Props
const props = defineProps({
  duration: {
    type: Number,
    required: true
  }
});

// Emit events
const emit = defineEmits(['stop']);

// Format the duration
const formattedDuration = computed(() => formatDuration(props.duration));

// Stop recording handler
const onStop = () => {
  emit('stop');
};
</script>

<style scoped>
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style> 