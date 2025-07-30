<template>
  <div class="note-block-container">
    <div class="note-header">
      <div class="section-drag-handle cursor-grab active:cursor-grabbing">
        <Icon name="dragVertical" :size="20" class="drag-icon" />
      </div>
      
      <div class="note-title">
        <Icon name="sticky-note" :size="18" class="note-icon" />
        <span>Note</span>
      </div>
      
      <div class="note-actions">
        <button 
          @click="confirmDelete" 
          class="delete-note-button"
          aria-label="Delete note"
        >
          <Icon name="trash" :size="18" />
        </button>
      </div>
    </div>
    
    <div class="note-content">
      <textarea
        v-model="noteContent"
        class="note-textarea"
        :class="{ 'collaborative-textarea': isCollaborative }"
        :style="collaborativeTextStyle"
        @input="handleTextareaInput"
        @focus="handleNoteFocus"
        @blur="handleNoteBlur"
        :rows="textareaRows"
        placeholder="Add notes, ideas or reminders here..."
        ref="textareaRef"
        aria-label="Note content"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Icon from '../ui/Icon.vue'
import { useAppConfirm } from '../../composables/useAppConfirm'

const props = defineProps({
  note: {
    type: Object,
    required: true
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
  'update:note',
  'delete-note',
  'author-change',     // For collaboration authorship
  'cursor-change'      // For collaboration cursor tracking
])

// Composables
const { confirmDelete: showDeleteConfirm } = useAppConfirm()

// Local state
const textareaRef = ref(null)
const textareaRows = ref(6) // Start with 6 rows

// Performance: Debounce text updates to reduce Firebase writes
const updateTimeout = ref(null)
const DEBOUNCE_DELAY = 350 // milliseconds

// Local reactive content for immediate UI updates
const localContent = ref(props.note.content || '')

// Watch props.note.content for external changes
watch(() => props.note.content, (newContent) => {
  if (newContent !== localContent.value) {
    localContent.value = newContent || ''
  }
}, { immediate: true })

// Computed property for v-model with debounced updates
const noteContent = computed({
  get: () => localContent.value,
  set: (value) => {
    // Immediate local update for responsive UI
    localContent.value = value
    
    // Debounce the actual update emit
    if (updateTimeout.value) {
      clearTimeout(updateTimeout.value)
    }
    
    updateTimeout.value = setTimeout(() => {
      const updatedNote = { ...props.note, content: value }
      emit('update:note', updatedNote)
      updateTimeout.value = null
    }, DEBOUNCE_DELAY)
  }
})

// Collaboration: Computed properties for text styling
const collaborativeTextStyle = computed(() => {
  if (!props.isCollaborative) {
    return {}
  }

  // Get the note's author color
  const authorColor = props.note.authorColor
  
  if (authorColor) {
    return {
      color: authorColor,
      caretColor: authorColor // Set cursor color to match text color
    }
  } else if (props.currentUserId && props.currentUserColor) {
    // Use current user's color for new/unassigned notes when they start typing
    return {
      color: props.currentUserColor,
      caretColor: props.currentUserColor
    }
  }

  return {}
})

// Check if current user is the author of this note
const isCurrentUserAuthor = computed(() => {
  return props.isCollaborative && 
         props.currentUserId && 
         props.note.authorId === props.currentUserId
})

// Check if note has been authored
const hasAuthor = computed(() => {
  return props.note.authorId && props.note.authorColor
})

// Watch for content changes to adjust height
watch(localContent, () => {
  nextTick(() => {
    adjustTextareaHeight()
  })
}, { immediate: true })

// Handle input - trigger height adjustment and set authorship
const handleTextareaInput = () => {
  // Set authorship when user starts typing (collaborative mode)
  if (props.isCollaborative && props.currentUserId && props.currentUserColor && !hasAuthor.value) {
    emit('author-change', {
      sectionId: props.note.id,
      authorId: props.currentUserId,
      authorColor: props.currentUserColor
    })
  }
  
  // Immediate height adjustment for responsive feel
  nextTick(() => {
    adjustTextareaHeight()
  })
}

/**
 * Handle note focus event
 */
const handleNoteFocus = (event) => {
  // Emit cursor change for collaboration
  if (props.isCollaborative && props.currentUserId) {
    emit('cursor-change', {
      sectionId: props.note.id,
      position: event.target.selectionStart || 0
    })
  }
}

/**
 * Handle note blur event
 */
const handleNoteBlur = (event) => {
  // Update authorship on blur if user made changes (collaborative mode)
  if (props.isCollaborative && props.currentUserId && props.currentUserColor) {
    emit('author-change', {
      sectionId: props.note.id,
      authorId: props.currentUserId,
      authorColor: props.currentUserColor,
      isModification: true
    })
  }
}

// Function to adjust textarea height based on content
const adjustTextareaHeight = () => {
  if (!textareaRef.value) return
  
  // Reset to minimum height
  textareaRef.value.style.height = 'auto'
  
  // Get the scroll height and set the height directly
  const scrollHeight = textareaRef.value.scrollHeight
  textareaRef.value.style.height = `${scrollHeight}px`
}

// Initialize height adjustment on mount
onMounted(() => {
  adjustTextareaHeight()
})

// Cleanup timeouts on unmount
onUnmounted(() => {
  if (updateTimeout.value) {
    clearTimeout(updateTimeout.value)
    updateTimeout.value = null
  }
})

// Delete confirmation handling
const confirmDelete = async () => {
  await showDeleteConfirm({
    title: 'Delete Note',
    message: 'Do you really want to delete this note?',
    confirmText: 'Delete',
    onConfirm: () => {
      // Emit delete event
      emit('delete-note', props.note.id)
    }
  })
}
</script>

<style scoped>
.note-block-container {
  @apply bg-amber-50/90 dark:bg-amber-900/20 rounded-lg shadow-sm hover:shadow-md 
         transition-all duration-300 overflow-hidden 
         border border-amber-200 dark:border-amber-700/30
         mb-5;
}

.note-header {
  @apply flex items-center justify-between py-2 px-3
         bg-amber-100/80 dark:bg-amber-800/30 
         backdrop-blur-sm rounded-t-lg 
         border-b border-amber-200 dark:border-amber-700/20;
}

.note-title {
  @apply flex items-center gap-1.5 text-amber-800 dark:text-amber-200 font-medium;
}

.note-icon {
  @apply text-amber-600 dark:text-amber-400;
}

.note-actions {
  @apply flex items-center;
}

.delete-note-button {
  @apply p-1.5 rounded-full text-amber-700 dark:text-amber-400
         hover:text-red-500 dark:hover:text-red-400
         hover:bg-red-50 dark:hover:bg-red-500/10 
         transition-colors;
}

.note-content {
  @apply p-3;
}

.note-textarea {
  @apply w-full bg-white/50 dark:bg-gray-800/30
         rounded-md p-3 text-gray-700 dark:text-gray-200
         placeholder-gray-500 dark:placeholder-gray-500
         border border-transparent focus:border-transparent
         focus:outline-none focus:ring-1 focus:ring-amber-400/30 dark:focus:ring-amber-500/30
         transition-colors duration-100
         resize-none;
  line-height: 1.5;
  overflow-y: hidden; /* Hide scrollbar since we're auto-expanding */
}

/* Section drag handle styles */
.section-drag-handle {
  @apply p-1.5 rounded-md text-amber-700 dark:text-amber-500 hover:bg-amber-200/50 dark:hover:bg-amber-700/30 transition-colors;
  touch-action: none;
}

.drag-icon {
  @apply opacity-70;
}

/* Collaborative text styling */
.collaborative-textarea {
  transition: color 0.2s ease, caret-color 0.2s ease;
}

.collaborative-textarea::selection {
  background-color: rgba(59, 130, 246, 0.2); /* Light blue selection */
}
</style> 