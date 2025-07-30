<template>
  <div class="flex flex-col items-center justify-center p-8 h-full">
    <div class="max-w-md w-full mx-auto text-center">
      <!-- Standard icon or logo -->
      <div v-if="icon !== 'document'" class="mb-4 icon-container">
        <Icon :name="icon" :size="48" class="text-gray-400 dark:text-gray-500" />
      </div>
      
      <!-- Custom logo for no song selected state -->
      <div v-else class="mb-6 note-logo-container">
        <div class="logo">
          <svg class="note-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="note-stem" d="M8 4L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path class="note-head" d="M8 16C8 17.6569 6.65685 19 5 19C3.34315 19 2 17.6569 2 16C2 14.3431 3.34315 13 5 13C6.65685 13 8 14.3431 8 16Z" stroke="currentColor" stroke-width="2"/>
            <path class="note-tail" d="M8 4L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path class="lyric-line-1" d="M12 10H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            <path class="lyric-line-2" d="M14 14H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
      
      <h2 class="text-2xl font-medium text-gray-800 dark:text-white mb-2">
        {{ title }}
      </h2>
      
      <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
        {{ description }}
      </p>
      
      <div>
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import Icon from '../ui/Icon.vue'

/**
 * EmptyState component
 * 
 * Used to display a visually pleasing empty state with icon/logo, title,
 * description and optional action buttons.
 */
defineProps({
  icon: {
    type: String,
    default: 'document' // Default shows the custom music note logo
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.icon-container {
  @apply inline-flex items-center justify-center p-4 rounded-full 
         bg-gray-100 dark:bg-gray-800 transition-all duration-300;
  animation: pulse 6s ease-in-out infinite;
}

/* Logo-specific styles */
.note-logo-container {
  @apply flex flex-col items-center justify-center transition-all duration-300;
  animation: gentle-pulse 6s ease-in-out infinite;
}

.logo {
  width: 140px;
  height: 140px;
  margin-bottom: 20px;
}

.note-icon {
  @apply text-[#0055cc] dark:text-white transition-colors duration-300;
  width: 100%;
  height: 100%;
}

.app-logo-text {
  @apply text-3xl font-bold tracking-tight text-[#0055cc] dark:text-white transition-colors duration-300;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
}

.note-stem, .note-head, .note-tail, .lyric-line-1, .lyric-line-2 {
  stroke-dasharray: 100;
  stroke-dashoffset: 0;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

@keyframes gentle-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

/* Responsive styles */
@media (max-width: 640px) {
  .icon-container {
    @apply p-3;
  }
  
  .logo {
    width: 100px;
    height: 100px;
    margin-bottom: 16px;
  }
  
  .app-logo-text {
    @apply text-2xl;
  }
}
</style> 