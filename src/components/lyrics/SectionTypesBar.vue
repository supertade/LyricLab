<template>
  <div class="section-types-container">
    <button 
      v-for="type in SECTION_TYPES" 
      :key="type.value"
      @click="addSection(type.value)"
      class="section-type-button"
      :class="{'btn-pressed': recentlyPressed === type.value}"
    >
      {{ type.label }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { SECTION_TYPES } from '../../config/constants'

const emit = defineEmits(['add-section'])
const recentlyPressed = ref(null)

/**
 * Add a new section of the specified type
 * Tracks button press state for animation feedback
 */
const addSection = (type) => {
  // Track which button was pressed for animation
  recentlyPressed.value = type
  
  // Emit event to add section
  emit('add-section', type)
  
  // Reset the pressed state after animation completes
  setTimeout(() => {
    recentlyPressed.value = null
  }, 400)
}
</script>

<style scoped>
.section-types-container {
  @apply fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg 
         border-t border-gray-200/50 dark:border-gray-700/50 grid grid-cols-3 gap-2 z-10 pb-safe;
}

.section-type-button {
  @apply px-4 py-2 bg-white dark:bg-gray-700/70 rounded-xl 
         text-gray-800 dark:text-white text-sm font-medium 
         hover:bg-gray-100 dark:hover:bg-gray-600/70 
         transition-all duration-200 shadow-sm
         border border-gray-300 dark:border-gray-600/50
         relative overflow-hidden;
}

/* Apple-style button press effect - subtle version */
.btn-pressed {
  transform: scale3d(0.98, 0.98, 1);
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.05) !important;
  transition: all 0.15s ease-out;
}

/* Subtler Ripple effect for buttons */
.section-type-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%);
  transform: translate3d(-50%, -50%, 0) scale3d(0, 0, 1);
  opacity: 0;
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  pointer-events: none;
}

.section-type-button:active::after {
  transform: translate3d(-50%, -50%, 0) scale3d(1, 1, 1);
  opacity: 0.2;
  transition: 0s;
}

/* Clean hover effect without lifting */
.section-type-button {
  transition: all 0.2s ease-out;
}

.section-type-button:hover {
  background-color: rgba(235, 235, 235, 0.8);
}

.dark .section-type-button:hover {
  background-color: rgba(75, 85, 99, 0.8);
}

/* Safe area bottom padding for notched devices */
@supports(padding: max(0px)) {
  .pb-safe {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
}
</style> 