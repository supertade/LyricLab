<template>
  <!-- 
    Reusable button component with various styles and sizes
    Supports icons on both sides, different variants, and responsive sizing
  -->
  <button 
    :class="[
      'transition-all duration-200 font-medium flex items-center justify-center focus:outline-none',
      sizeClasses,
      variantClasses,
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      fullWidth ? 'w-full' : '',
      className
    ]" 
    :disabled="disabled"
    v-bind="$attrs"
  >
    <!-- Left icon slot -->
    <span v-if="$slots['icon-left']" class="mr-1.5">
      <slot name="icon-left"></slot>
    </span>
    <!-- Button text/content -->
    <span v-if="$slots.default">
      <slot></slot>
    </span>
    <!-- Right icon slot -->
    <span v-if="$slots['icon-right']" class="ml-1.5">
      <slot name="icon-right"></slot>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue';

/**
 * Button component props
 */
const props = defineProps({
  // Button style variant (primary, secondary, danger, ghost, text)
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost', 'text'].includes(value)
  },
  // Button size (sm, md, lg)
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  // Disabled state
  disabled: {
    type: Boolean,
    default: false
  },
  // Full width option
  fullWidth: {
    type: Boolean,
    default: false
  },
  // Additional CSS classes
  className: {
    type: String,
    default: ''
  }
});

/**
 * Computes CSS classes based on button size
 * - sm: Smallest button
 * - md: Medium sized button (default)
 * - lg: Large button
 */
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm': return 'text-xs px-3 py-1.5 rounded-md';
    case 'lg': return 'text-base px-6 py-3 rounded-lg';
    default: return 'text-sm px-4 py-2 rounded-lg';
  }
});

/**
 * Computes CSS classes based on button variant
 * - primary: Blue button (default)
 * - secondary: Gray button
 * - danger: Red button for destructive actions
 * - ghost: Transparent with hover effect
 * - text: Text-only with no background
 */
const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 shadow-sm hover:shadow-md active:shadow focus:ring focus:ring-blue-300/30';
    case 'secondary':
      return 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/15 active:bg-gray-300 dark:active:bg-white/20 shadow-sm hover:shadow-md active:shadow focus:ring focus:ring-gray-300/30';
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 shadow-sm hover:shadow-md active:shadow focus:ring focus:ring-red-300/30';
    case 'ghost':
      return 'bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 active:bg-gray-200 dark:active:bg-white/10 text-gray-800 dark:text-white focus:ring focus:ring-gray-300/30';
    case 'text':
      return 'bg-transparent text-blue-600 dark:text-blue-400 hover:underline focus:ring focus:ring-blue-300/30';
    default:
      return '';
  }
});
</script> 