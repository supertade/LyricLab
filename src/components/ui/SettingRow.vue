<template>
  <div 
    @click="handleClick"
    class="flex items-center px-4 py-4 transition-colors duration-150 select-none"
    :class="[
      clickable ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer active:bg-gray-100 dark:active:bg-gray-700' : '',
      variant === 'danger' ? 'hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30' : '',
      disabled ? 'opacity-50 cursor-not-allowed' : ''
    ]"
  >
    <!-- Icon -->
    <div 
      class="w-7 h-7 rounded-md flex items-center justify-center mr-3 flex-shrink-0"
      :class="iconBackgroundColor"
    >
      <Icon 
        :name="icon" 
        :size="18" 
        :class="iconColor"
      />
    </div>
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div 
        class="font-medium truncate"
        :class="titleColor"
      >
        {{ title }}
      </div>
      <div 
        v-if="subtitle" 
        class="text-sm truncate"
        :class="subtitleColor"
      >
        {{ subtitle }}
      </div>
    </div>
    
    <!-- Loading Spinner -->
    <div v-if="loading" class="ml-3">
      <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
    
    <!-- Right Content (slot or chevron) -->
    <div v-else-if="$slots.default || chevron" class="ml-3 flex-shrink-0">
      <slot>
        <Icon v-if="chevron" name="chevronRight" :size="16" class="text-gray-400" />
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value: string) => ['default', 'danger'].includes(value)
  },
  chevron: {
    type: Boolean,
    default: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  click: []
}>()

// Computed
const clickable = computed(() => !props.disabled && !props.loading)

const iconBackgroundColor = computed(() => {
  if (props.variant === 'danger') {
    return 'bg-red-100 dark:bg-red-900/30'
  }
  
  // Different colors based on icon for visual variety
  const iconColors: Record<string, string> = {
    settings: 'bg-gray-100 dark:bg-gray-700',
    cloud: 'bg-blue-100 dark:bg-blue-900/30',
    moon: 'bg-indigo-100 dark:bg-indigo-900/30',
    sun: 'bg-amber-100 dark:bg-amber-900/30',
    song: 'bg-green-100 dark:bg-green-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30',
    close: 'bg-red-100 dark:bg-red-900/30'
  }
  
  return iconColors[props.icon] || 'bg-gray-100 dark:bg-gray-700'
})

const iconColor = computed(() => {
  if (props.variant === 'danger') {
    return 'text-red-600 dark:text-red-400'
  }
  
  // Matching icon colors
  const iconColors: Record<string, string> = {
    settings: 'text-gray-600 dark:text-gray-400',
    cloud: 'text-blue-600 dark:text-blue-400',
    moon: 'text-indigo-600 dark:text-indigo-400',
    sun: 'text-amber-600 dark:text-amber-400',
    song: 'text-green-600 dark:text-green-400',
    info: 'text-blue-600 dark:text-blue-400',
    close: 'text-red-600 dark:text-red-400'
  }
  
  return iconColors[props.icon] || 'text-gray-600 dark:text-gray-400'
})

const titleColor = computed(() => {
  if (props.disabled) {
    return 'text-gray-400 dark:text-gray-500'
  }
  if (props.variant === 'danger') {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-gray-900 dark:text-white'
})

const subtitleColor = computed(() => {
  if (props.disabled) {
    return 'text-gray-300 dark:text-gray-600'
  }
  if (props.variant === 'danger') {
    return 'text-red-500 dark:text-red-400'
  }
  return 'text-gray-500 dark:text-gray-400'
})

// Methods
const handleClick = () => {
  if (clickable.value) {
    emit('click')
  }
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 