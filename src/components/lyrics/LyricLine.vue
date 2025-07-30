<template>
  <div 
    class="line-container group relative overflow-hidden" 
    :class="{ 'deleting': isDeleting }"
    @touchstart="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <!-- Delete action revealed on swipe -->
    <div 
      class="absolute inset-y-0 right-0 bg-red-500 text-white flex items-center justify-end pr-4 swipe-delete-area"
      :style="{ width: swipeDeleteWidth + 'px', transform: `translateX(${swipeDeleteWidth + Math.abs(Math.min(swipeOffset.value, 0))}px)` }"
    >
      <Icon name="trash" :size="20" />
      <span class="ml-2 font-medium">Delete</span>
    </div>
    
    <!-- Main content -->
    <div 
      class="flex items-center gap-3 w-full transition-transform duration-150 px-3"
      :style="{ transform: `translateX(${swipeOffset}px)` }"
      ref="lineContent"
    >
      <!-- Drag Handle -->
      <div 
        class="line-drag-handle touch-manipulation cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
        role="button"
        tabindex="0"
      >
        <Icon name="dragHorizontal" :size="20" class="drag-icon" />
      </div>
      
      <!-- Syllable Counter -->
      <div class="syllable-count-container">
        <span class="syllable-count" :class="{'text-blue-500 dark:text-blue-400': line.text}">
          {{ line.syllables || 0 }}
        </span>
      </div>
      
      <!-- Line Input -->
      <div class="flex-grow w-full min-w-0">
        <textarea
          v-model="line.text"
          class="line-input"
          :class="{ 'collaborative-input': isCollaborative }"
          :style="collaborativeTextStyle"
          placeholder="Enter lyrics..."
          @input="handleLineInput"
          @focus="handleLineFocus"
          @blur="handleLineBlur"
          @keydown="handleKeyDown"
          rows="1"
          ref="lineInput"
          aria-label="Lyrics text"
        ></textarea>
      </div>
      
      <!-- Delete Button -->
      <button 
        @click="confirmDelete" 
        class="delete-button"
        aria-label="Delete line"
      >
        <Icon name="close" :size="20" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick, onUnmounted } from 'vue'
import Icon from '../ui/Icon.vue'
import { countSyllables } from '../../utils/formatters'
import { useAppConfirm } from '../../composables/useAppConfirm'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps({
  section: {
    type: Object,
    required: true
  },
  line: {
    type: Object,
    required: true
  },
  // Index of the current line in the section
  index: {
    type: Number,
    default: -1
  },
  // Total number of lines in the section
  totalLines: {
    type: Number,
    default: 0
  },
  // Collaboration props
  isCollaborative: {
    type: Boolean,
    default: false
  },
  currentUserId: {
    type: String,
    default: ''
  },
  currentUserColor: {
    type: String,
    default: '#6B7280'
  },
  sessionId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'delete',
  'change',
  'focus-next-line',   // To focus the next line
  'add-new-line',      // To add a new line
  'author-change',     // To notify about authorship change
  'cursor-change'      // To notify about cursor position change
])
const lineInput = ref(null)
const lineContent = ref(null)
const isDeleting = ref(false)

// Swipe states
const swipeOffset = ref(0)
const startX = ref(0)
const currentX = ref(0)
const swipeDeleteWidth = ref(100) // Width of delete area
const swipeThreshold = 80 // Minimum swipe distance to trigger delete
const isSwiping = ref(false)
const touchIntent = ref(null) // 'drag' or 'swipe'

// Composables
const { confirmDelete: showDeleteConfirm } = useAppConfirm()

// Performance: Debounce text updates to reduce Firebase writes
const updateTimeout = ref(null)
const DEBOUNCE_DELAY = 350 // milliseconds

// Collaboration: Computed properties for text styling
const collaborativeTextStyle = computed(() => {
  if (!props.isCollaborative) {
    return {}
  }

  // Get the line's author color
  const authorColor = props.line.authorColor
  
  if (authorColor) {
    return {
      color: authorColor,
      caretColor: authorColor // Set cursor color to match text color
    }
  } else if (props.currentUserId && props.currentUserColor) {
    // Use current user's color for new/unassigned lines when they start typing
    return {
      color: props.currentUserColor,
      caretColor: props.currentUserColor
    }
  }

  return {}
})

// Check if current user is the author of this line
const isCurrentUserAuthor = computed(() => {
  return props.isCollaborative && 
         props.currentUserId && 
         props.line.authorId === props.currentUserId
})

// Check if line has been authored
const hasAuthor = computed(() => {
  return props.line.authorId && props.line.authorColor
})

/**
 * Helper to truncate text for display in confirmation dialog
 */
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length <= maxLength 
    ? text 
    : text.slice(0, maxLength) + '…';
}

/**
 * Handles keyboard inputs for the textarea
 */
const handleKeyDown = (event) => {
  // When Enter key is pressed
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevents line break in textarea
    
    // If it's not the last line, move to the next line
    if (props.index < props.totalLines - 1) {
      emit('focus-next-line', props.index + 1);
    } else {
      // If it's the last line, add a new line
      emit('add-new-line');
    }
  }
}

/**
 * Touch event handlers
 */
const onTouchStart = (event) => {
  // Don't initialize swipe if user is interacting with the textarea
  if (document.activeElement === lineInput.value) return
  
  startX.value = event.touches[0].clientX
  currentX.value = startX.value
  
  // Determine if this will be a drag or swipe
  const isDragHandle = event.target.closest('.line-drag-handle')
  touchIntent.value = isDragHandle ? 'drag' : 'swipe'
  
  // For drag handles, don't do anything else - let the draggable component handle it
  if (touchIntent.value === 'drag') {
    // Just add visual feedback
    if (isDragHandle) {
      isDragHandle.classList.add('touch-active')
    }
    return
  }
  
  // Only mark as swiping if not on a handle
  if (touchIntent.value === 'swipe') {
    isSwiping.value = true
  }
}

/**
 * Handle touch move events
 */
const onTouchMove = (event) => {
  // If we already know it's a drag intent, do nothing
  // The draggable module will handle drag logic
  if (touchIntent.value === 'drag') return
  
  // Only proceed if it's a swipe intent
  if (!isSwiping.value || touchIntent.value !== 'swipe') return
  
  currentX.value = event.touches[0].clientX
  const diff = currentX.value - startX.value
  
  // Horizontal swiping - only to the left for delete
  if (diff < 0) {
    swipeOffset.value = diff
    
    // Add swipe feedback class when swiping far enough
    if (diff < -40 && lineContent.value) {
      lineContent.value.classList.add('swiping-active')
    } else if (lineContent.value) {
      lineContent.value.classList.remove('swiping-active')
    }
  } else {
    // Return to original position if already scrolled
    if (swipeOffset.value < 0) {
      swipeOffset.value = Math.min(0, diff)
    } else {
      swipeOffset.value = 0
    }
  }
}

/**
 * Handle touch end event
 */
const onTouchEnd = () => {
  // Only handle if we're swiping
  if (isSwiping.value && touchIntent.value === 'swipe') {
    isSwiping.value = false
    
    // Remove swiping class if it was added
    if (lineContent.value) {
      lineContent.value.classList.remove('swiping-active')
    }
    
    // Check if swiped far enough to delete
    if (swipeOffset.value < -swipeThreshold) {
      // If swiped far enough, show delete confirmation
      confirmDelete()
    } else {
      // Otherwise reset position
      resetSwipe()
    }
  }
  
  // Reset drag intent and handlers
  if (touchIntent.value === 'drag' && event.target.closest('.line-drag-handle')) {
    const el = event.target.closest('.line-drag-handle')
    el.classList.remove('touch-active')
  }
  
  touchIntent.value = null
}

/**
 * Show delete confirmation dialog
 */
const confirmDelete = async () => {
  await showDeleteConfirm({
    title: 'Delete Line',
    message: 'Do you really want to delete this line?',
    confirmText: 'Delete',
    onConfirm: () => {
      // Start delete animation
      isDeleting.value = true
      
      // Wait for animation to complete before actually deleting
      setTimeout(() => {
        emit('delete', props.line.id)
      }, 350) // Match animation duration
    }
  })
}

/**
 * Reset swipe position with animation
 */
const resetSwipe = () => {
  // Animation to reset swipe position
  if (lineContent.value) {
    lineContent.value.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
    swipeOffset.value = 0
    
    // Reset transition after animation
    setTimeout(() => {
      if (lineContent.value) {
        lineContent.value.style.transition = 'transform 0.15s'
      }
    }, 300)
  }
}

/**
 * Handle textarea input events
 * Auto-grows the textarea and updates syllable count
 * Uses debouncing to reduce Firebase writes for better performance
 */
const handleLineInput = (event) => {
  // Immediate UI updates for responsive feel
  autoGrow(event.target)
  props.line.syllables = countSyllables(props.line.text)
  
  // Set authorship when user starts typing (collaborative mode)
  if (props.isCollaborative && props.currentUserId && props.currentUserColor && !hasAuthor.value) {
    emit('author-change', {
      sectionId: props.section.id,
      lineId: props.line.id,
      authorId: props.currentUserId,
      authorColor: props.currentUserColor
    })
  }
  
  // Debounce the actual change emit to reduce Firebase writes
  if (updateTimeout.value) {
    clearTimeout(updateTimeout.value)
  }
  
  updateTimeout.value = setTimeout(() => {
    debug('📤 Sending debounced text update:', props.line.text.substring(0, 20) + '...')
    emit('change')
    updateTimeout.value = null
  }, DEBOUNCE_DELAY)
}

/**
 * Handle line focus event
 */
const handleLineFocus = (event) => {
  autoGrow(event.target)
  
  // Emit cursor change for collaboration
  if (props.isCollaborative && props.currentUserId) {
    emit('cursor-change', {
      sectionId: props.section.id,
      lineId: props.line.id,
      position: event.target.selectionStart || 0
    })
  }
}

/**
 * Handle line blur event
 */
const handleLineBlur = (event) => {
  autoGrow(event.target)
  
  // Update authorship on blur if user made changes (collaborative mode)
  if (props.isCollaborative && props.currentUserId && props.currentUserColor) {
    emit('author-change', {
      sectionId: props.section.id,
      lineId: props.line.id,
      authorId: props.currentUserId,
      authorColor: props.currentUserColor,
      isModification: true
    })
  }
}

/**
 * Auto-grow textarea to fit content
 */
const autoGrow = (textarea) => {
  if (!textarea) return
  
  // Ensure the textarea is visible
  if (textarea.offsetParent === null) return
  
  // Reset height to get the correct scrollHeight
  textarea.style.height = 'auto'
  
  // Extra space for better wrapping
  const extraSpace = 2 // pixels
  textarea.style.height = (textarea.scrollHeight + extraSpace) + 'px'
  
  // Delayed reapplication for complex cases (e.g., after DOM changes)
  setTimeout(() => {
    textarea.style.height = 'auto'
    textarea.style.height = (textarea.scrollHeight + extraSpace) + 'px'
  }, 0)
}

/**
 * Public method to focus the text field
 */
const focus = () => {
  if (lineInput.value) {
    lineInput.value.focus();
    
    // Set cursor to end of text
    const length = lineInput.value.value.length;
    lineInput.value.setSelectionRange(length, length);
  }
}

// Expose public methods
defineExpose({
  focus
})

// Automatic growth when mounting and when text changes
onMounted(() => {
  if (lineInput.value) {
    autoGrow(lineInput.value)
  }
})

onUnmounted(() => {
  // Clean up pending timeouts to prevent memory leaks
  if (updateTimeout.value) {
    clearTimeout(updateTimeout.value)
    updateTimeout.value = null
  }
})

watch(() => props.line.text, () => {
  if (lineInput.value) {
    autoGrow(lineInput.value)
  }
})
</script>

<style scoped>
.line-container {
  @apply py-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200 border-b border-gray-100 dark:border-gray-700/30;
  margin-bottom: 0;
  transform-origin: center;
  will-change: transform, opacity;
}

.line-container:last-child {
  @apply border-b-0;
}

.line-drag-handle {
  @apply p-1.5
         text-gray-600 dark:text-gray-400
         transition-all duration-150
         cursor-grab opacity-60 group-hover:opacity-100
         hover:scale-110 active:scale-90
         bg-gray-50 dark:bg-gray-700/30
         hover:bg-gray-100 dark:hover:bg-gray-700/50
         active:bg-gray-200 dark:active:bg-gray-700/80
         rounded;
  -webkit-tap-highlight-color: transparent;
  touch-action: none !important;
  -webkit-touch-callout: none !important;
  user-select: none !important;
}

.drag-icon {
  @apply opacity-70 transition-opacity;
  pointer-events: none;
}

.line-drag-handle:hover .drag-icon {
  @apply opacity-100;
}

/* Touch active state - applied during touch events */
.touch-active {
  @apply bg-gray-200 dark:bg-gray-700/80 scale-95 opacity-100;
  transform-origin: center;
  transition: all 0.08s ease-out;
}

/* For swiping feedback */
.swiping-active {
  @apply bg-red-50 dark:bg-red-950/10;
  transition: background-color 0.2s ease;
}

.syllable-count {
  @apply bg-gray-200 dark:bg-gray-700/50 text-xs text-gray-700 dark:text-gray-400 
         py-0.5 px-2 rounded-full font-mono min-w-[24px] text-center 
         transition-colors duration-200;
}

.syllable-count-container {
  @apply flex items-center self-stretch;
}

.line-input {
  @apply bg-transparent text-gray-800 dark:text-white focus:outline-none 
         resize-none overflow-hidden w-full
         focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500;
  line-height: 1.5;
  word-wrap: break-word;
  word-break: break-word;
  border: none !important;
  outline: none !important;
  -webkit-appearance: none;
  box-shadow: none !important;
  min-height: 34px;
  padding: 4px 0;
  display: flex;
  align-items: center;
  vertical-align: middle;
}

/* Placeholder text disappears immediately on focus */
.line-input:focus::placeholder {
  color: transparent !important;
}

/* Text and cursor alignment in the middle */
.line-input {
  caret-color: currentColor;
}

/* Collaborative text styling */
.collaborative-input {
  transition: color 0.2s ease, caret-color 0.2s ease;
}

.collaborative-input::selection {
  background-color: rgba(59, 130, 246, 0.2); /* Light blue selection */
}

.delete-button {
  @apply p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600/50 
         text-gray-500 hover:text-red-500 transition-all duration-200 
         opacity-0 group-hover:opacity-100;
}

/* Collaborative text styling */
.collaborative-input {
  transition: color 0.2s ease, caret-color 0.2s ease;
}

.collaborative-input::selection {
  background-color: rgba(59, 130, 246, 0.2); /* Light blue selection */
}

/* Swipe delete area */
.swipe-delete-area {
  @apply transition-transform duration-200;
  transform: translateX(100%); /* Hide by default */
}

/* Line deletion animation */
@keyframes line-delete-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-10px);
  }
}

.deleting {
  animation: line-delete-out 0.3s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
  will-change: transform, opacity;
  pointer-events: none;
}

.deleting > * {
  animation: content-fade 0.25s ease-out forwards;
}

@keyframes content-fade {
  to { opacity: 0; }
}

/* Touch-friendly styles for mobile */
@media (max-width: 768px) {
  .delete-button {
    @apply opacity-60;
  }
  
  .line-drag-handle {
    @apply opacity-80;
    padding: 8px;
    margin: -2px 0;
  }
}

/* Modal fade animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Utility class for better touch interactions */
.touch-manipulation {
  touch-action: manipulation;
}

/* Dragging animation improvements */
.dragging-line {
  @apply shadow-md bg-white dark:bg-gray-800 border border-blue-400/70 dark:border-blue-500/70 
         z-30 rounded-md !important;
  transform: scale(1.025) translateZ(0);
  cursor: grabbing !important;
  -webkit-font-smoothing: antialiased;
  backface-visibility: hidden;
  perspective: 1000px;
  will-change: transform;
}
</style> 