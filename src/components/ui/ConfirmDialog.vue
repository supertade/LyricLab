<template>
  <teleport to="body">
    <div 
      v-if="show" 
      class="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      role="dialog"
      :aria-labelledby="`${id}-title`"
    >
      <!-- Backdrop overlay -->
      <div 
        class="absolute inset-0 bg-black bg-opacity-60" 
        @click="$emit('cancel')"
      ></div>
      
      <!-- Modal dialog -->
      <div 
        class="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-xl border border-gray-200 dark:border-gray-700"
        :style="{ width: width }"
      >
        <h3 :id="`${id}-title`" class="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          {{ title }}
        </h3>
        
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          {{ message }}
        </p>
        
        <div class="flex justify-end gap-3">
          <button 
            @click="$emit('cancel')" 
            class="py-2 px-4 rounded-lg text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {{ cancelText }}
          </button>
          
          <button 
            @click="$emit('confirm')" 
            class="py-2 px-4 rounded-lg text-sm font-medium transition-colors text-white"
            :class="confirmButtonClass"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed } from 'vue';

// Props
const props = defineProps({
  id: {
    type: String,
    default: 'dialog'
  },
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  type: {
    type: String,
    default: 'primary', // 'primary', 'danger', 'warning'
    validator: (value) => ['primary', 'danger', 'warning'].includes(value)
  },
  width: {
    type: String,
    default: '320px'
  }
});

// Emit events
const emit = defineEmits(['confirm', 'cancel']);

// Compute button class based on type
const confirmButtonClass = computed(() => {
  switch (props.type) {
    case 'danger':
      return 'bg-red-500 hover:bg-red-600';
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600';
    case 'primary':
    default:
      return 'bg-blue-500 hover:bg-blue-600';
  }
});
</script> 