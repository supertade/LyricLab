<template>
  <teleport to="body">
    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-4"
    >
      <div 
        v-if="isVisible" 
        class="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
        role="dialog"
        aria-labelledby="app-dialog-title"
      >
        <!-- Backdrop overlay with fade effect -->
        <div 
          class="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
          @click="onCancelClick"
        ></div>
        
        <!-- Modal dialog -->
        <div 
          class="relative z-10 bg-white dark:bg-gray-800 rounded-xl p-5 shadow-xl border border-gray-200 dark:border-gray-700 transform transition-all"
          :style="{ width: config.width }"
        >
          <h3 
            id="app-dialog-title" 
            class="text-lg font-semibold text-gray-800 dark:text-white mb-3"
          >
            {{ config.title }}
          </h3>
          
          <p 
            class="text-sm text-gray-600 dark:text-gray-300 mb-6"
            v-html="formattedMessage"
          ></p>
          
          <div class="flex justify-end gap-3">
            <button 
              v-if="!config.hideCancel"
              @click="onCancelClick" 
              class="py-2 px-4 rounded-lg text-sm font-medium text-gray-700 dark:text-white bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {{ config.cancelText }}
            </button>
            
            <button 
              @click="onConfirmClick" 
              class="py-2 px-4 rounded-lg text-sm font-medium transition-colors text-white"
              :class="buttonClass"
            >
              {{ config.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useAppConfirm } from '../../composables/useAppConfirm';

// Import Modal state and methods
const { 
  isVisible, 
  config, 
  confirmAction, 
  cancelAction 
} = useAppConfirm();

// Format message with line breaks if needed
const formattedMessage = computed(() => {
  if (!config.message) return '';
  return config.message.replace(/\n/g, '<br>');
});

// Compute button class based on type
const buttonClass = computed(() => {
  switch (config.type) {
    case 'danger':
      return 'bg-red-500 hover:bg-red-600';
    case 'warning':
      return 'bg-amber-500 hover:bg-amber-600';
    case 'success':
      return 'bg-green-500 hover:bg-green-600';
    case 'primary':
    default:
      return 'bg-blue-500 hover:bg-blue-600';
  }
});

// Event handlers
const onConfirmClick = () => {
  confirmAction();
};

const onCancelClick = () => {
  cancelAction();
};

// Close dialog on Escape key press
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && isVisible.value) {
    cancelAction();
  }
};

// Setup and cleanup event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script> 