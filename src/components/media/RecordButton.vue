<template>
  <div class="flex justify-center" style="height: 28px;">
    <button 
      @click="onClick" 
      class="flex items-center justify-center gap-1 py-1 px-2.5 rounded-full bg-gray-200 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-xs font-medium text-gray-800 dark:text-white transition-all duration-200"
      :class="{ 'animate-pulse': isHovering }"
      @mouseenter="isHovering = true"
      @mouseleave="isHovering = false"
      :aria-label="ariaLabel"
    >
      <slot name="icon">
        <Icon :name="icon" :size="20" />
      </slot>
      <span v-if="label" class="opacity-90 text-xs whitespace-nowrap">{{ label }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Icon from '../ui/Icon.vue';

// Props
const props = defineProps({
  icon: {
    type: String,
    default: 'mic'
  },
  label: {
    type: String,
    default: 'Record'
  },
  ariaLabel: {
    type: String,
    default: 'Start recording'
  }
});

// Emit events
const emit = defineEmits(['click']);

const isHovering = ref(false);

// Click handler
const onClick = () => {
  emit('click');
};
</script> 