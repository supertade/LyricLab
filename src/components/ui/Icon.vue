<template>
  <svg 
    :width="size" 
    :height="size" 
    :viewBox="viewBox" 
    :class="className" 
    fill="none" 
    stroke="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    role="img"
    focusable="false"
  >
    <path 
      :stroke-linecap="strokeLinecap" 
      :stroke-linejoin="strokeLinejoin" 
      :stroke-width="strokeWidth" 
      :d="getPath()" 
      :fill="fill"
    />
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: [String, Number],
    default: '24'
  },
  className: {
    type: String,
    default: ''
  },
  strokeWidth: {
    type: [String, Number],
    default: '1.5'
  },
  strokeLinecap: {
    type: String,
    default: 'round'
  },
  strokeLinejoin: {
    type: String,
    default: 'round'
  },
  fill: {
    type: String,
    default: 'none'
  },
  viewBox: {
    type: String,
    default: '0 0 24 24'
  }
});

// Icon-Pfad-Definitionen
const iconPaths = {
  // Navigations-Icons
  menu: 'M4 6h16M4 12h16M4 18h7',
  close: 'M6 18L18 6M6 6l12 12',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 19l-7-7 7-7',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronUp: 'M5 15l7-7 7 7',
  
  // Aktions-Icons
  plus: 'M12 4v16m8-8H4',
  trash: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  edit: 'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z',
  search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  
  // Gesture-Icons
  'swipe-left': 'M20 12H8m0 0l4-4m-4 4l4 4M4 5v14',
  
  // Media-Icons
  mic: 'M12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15Z M5 11C5 10.4477 4.55228 10 4 10C3.44772 10 3 10.4477 3 11V12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12V11C21 10.4477 20.5523 10 20 10C19.4477 10 19 10.4477 19 11V12C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12V11Z',
  play: 'M6 4.75c0-1.1 1.2-1.8 2.2-1.2l11.5 7.5c.8.5.8 1.7 0 2.2l-11.5 7.5c-1 .6-2.2-.1-2.2-1.2V4.75z',
  pause: 'M10 4h4v16h-4z M18 4h4v16h-4z',
  stop: 'M6 6h12v12H6z',
  
  // Drag-Icons
  dragVertical: 'M4 8h16M4 16h16',
  dragHorizontal: 'M8 9h8M8 12h8M8 15h8',
  
  // Cloud & Storage Icons
  cloud: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  time: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  

  
  // Andere Icons
  song: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
  document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  note: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M9 15H4m5-4H4m12-7l5 5m-5-5v5h5',
  
  // Theme-Icons
  sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  
  // Settings Icon
  settings: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  
  // Auth Icons
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z',
  'eye-slash': 'M14.12 14.12a3 3 0 01-4.24-4.24m0 0L7.76 7.76a9.015 9.015 0 000 8.49m2.12-2.12l1.414 1.414L14.12 12.88m0 0L18.36 17.12M3 3l18 18M9.879 9.879l4.242 4.242M9.879 9.879A3 3 0 0112 9a3.001 3.001 0 011.879.879M14.121 14.121A3 3 0 0112 15a3.001 3.001 0 01-1.879-.879M14.121 14.121L12 12m0 0L9.879 9.879M12 12l2.121 2.121M3 3l3.879 6.879M21 21l-3.879-6.879',
  'exclamation-triangle': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
};

const getPath = () => {
  return iconPaths[props.name] || '';
};
</script>

<style scoped>
/* Add small animation for interactive icons */
svg {
  @apply transition-transform duration-200;
}

:deep(button:hover) > svg, 
:deep(a:hover) > svg {
  transform: scale(1.05);
}

:deep(button:active) > svg, 
:deep(a:active) > svg {
  transform: scale(0.95);
}
</style> 