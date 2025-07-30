<template>
  <div 
    :class="[
      'section-container origin-top overflow-hidden',
      isDeleting ? 'pointer-events-none deleting' : ''
    ]"
  >
    <div class="section-header">
      <div class="section-title-row">
        <div class="flex items-center gap-2">
          <div class="section-drag-handle cursor-grab active:cursor-grabbing" tabindex="0">
            <Icon name="dragVertical" :size="20" class="drag-icon" />
          </div>
          <input
            type="text"
            v-model="section.title"
            class="section-title-input"
            @input="handleSectionTitleChange"
            aria-label="Section title"
          />
        </div>
        
        <div class="flex items-center gap-3">
          <AudioRecorder 
            :sectionId="section.id"
            :initialAudioData="section.recording"
            @save-recording="handleSaveRecording"
            @delete-recording="handleDeleteRecording"
          />
          
          <div class="section-actions">
            <button 
              @click="handleDeleteSection" 
              class="delete-section-button"
              aria-label="Delete section"
            >
              <Icon name="trash" :size="20" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Lines - Minimales Draggable -->
    <draggable 
      v-model="section.lines" 
      class="lyric-lines"
      handle=".line-drag-handle"
      item-key="id"
      @end="updateSong"
      :animation="200"
      :forceFallback="true"
      :fallbackClass="'dragging-line'"
      :fallbackOnBody="true"
      :group="'lines'"
    >
      <template #item="{ element: line, index }">
        <div class="line-wrapper" :class="{'newly-added': isNewlyAdded(line.id)}">
          <LyricLine 
            :section="section" 
            :line="line" 
            :index="index"
            :totalLines="section.lines.length"
            :isCollaborative="isCollaborative"
            :currentUserId="currentUserId"
            :currentUserColor="currentUserColor"
            :sessionId="sessionId"
            @delete="deleteLine" 
            @change="handleLineChange"
            @focus-next-line="focusLineByIndex"
            @add-new-line="addLine"
            @author-change="handleAuthorChange"
            @cursor-change="handleCursorChange"
            :ref="el => { if (el) lineRefs[line.id] = el }"
          />
        </div>
      </template>
    </draggable>

    <!-- Add Line Button -->
    <button 
      @click="addLine"
      class="add-line-button"
      aria-label="Add new line"
      :class="{ 'pointer-events-none': isDeleting }"
    >
      <Icon name="plus" :size="20" />
      <span>New Line</span>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, onBeforeUpdate } from 'vue'
import { useFileManager } from '../../stores/fileManager'
import { useAppConfirm } from '../../composables/useAppConfirm'
import draggable from 'vuedraggable'
import AudioRecorder from '../media/AudioRecorder.vue'
import LyricLine from './LyricLine.vue'
import Icon from '../ui/Icon.vue'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps({
  section: {
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

// Define the emit function
const emit = defineEmits([
  'update:section', 
  'delete-section', 
  'add-line', 
  'delete-line', 
  'save-recording', 
  'delete-recording',
  'author-change',     // For collaboration authorship
  'cursor-change'      // For collaboration cursor tracking
])

const fileManager = useFileManager()
const { confirmDelete: showDeleteConfirm } = useAppConfirm()

// Track the last added line ID for animation
const lastAddedLineId = ref(null)
const isDeleting = ref(false)
// Object to store line references
const lineRefs = ref({})

// Reset references before update
onBeforeUpdate(() => {
  lineRefs.value = {}
})

/**
 * Handle section title changes
 */
const handleSectionTitleChange = () => {
  emit('update:section', props.section)
}

/**
 * Show confirmation dialog for section deletion using the global dialog
 */
const handleDeleteSection = async () => {
  const confirmed = await showDeleteConfirm({
    title: 'Delete Section',
    message: `Do you really want to delete the "${props.section.title}" section?`,
    confirmText: 'Delete',
    onConfirm: () => {
      isDeleting.value = true
      setTimeout(() => {
        emit('delete-section', props.section.id)
      }, 400)
    }
  })
}

/**
 * Add a new line to the section
 */
const addLine = () => {
  emit('add-line', props.section.id)
  
  nextTick(() => {
    if (props.section.lines.length > 0) {
      const newLineId = props.section.lines[props.section.lines.length - 1].id
      lastAddedLineId.value = newLineId
      
      // Focus the newly added line
      focusLineById(newLineId)
      
      // Reset animation flag
      setTimeout(() => {
        lastAddedLineId.value = null
      }, 800)
    }
  })
}

/**
 * Focus a line based on its index
 */
const focusLineByIndex = (index) => {
  if (index >= 0 && index < props.section.lines.length) {
    const lineId = props.section.lines[index].id
    focusLineById(lineId)
  }
}

/**
 * Focus a line based on its ID
 */
const focusLineById = (lineId) => {
  nextTick(() => {
    if (lineRefs.value[lineId]) {
      lineRefs.value[lineId].focus()
    }
  })
}

/**
 * Delete a line from the section
 */
const deleteLine = (lineId) => {
  emit('delete-line', props.section.id, lineId)
}

/**
 * Handle changes to a line
 */
const handleLineChange = () => {
  emit('update:section', props.section)
}

/**
 * Update song in store after drag ends
 */
const updateSong = () => {
  debug('Updating song with lines:', props.section.lines.map(l => l.id).join(', '));
  
  // Update the current section
  emit('update:section', props.section);
  
  // Update the entire song in the store
  try {
    const currentSong = fileManager.currentSong;
    if (currentSong) {
      fileManager.updateSong(currentSong);
    }
  } catch (err) {
    error('Error updating song:', err);
  }
}

/**
 * Check if line was newly added for animation
 */
const isNewlyAdded = (lineId) => {
  return lastAddedLineId.value === lineId
}

/**
 * Handle saving of audio recording
 */
const handleSaveRecording = (audioBlob, metadata) => {
  emit('save-recording', props.section.id, audioBlob, metadata)
}

/**
 * Handle deletion of audio recording
 */
const handleDeleteRecording = () => {
  emit('delete-recording', props.section.id)
}

/**
 * Handle authorship change for collaboration
 */
const handleAuthorChange = (authorData) => {
  emit('author-change', authorData)
}

/**
 * Handle cursor change for collaboration
 */
const handleCursorChange = (cursorData) => {
  emit('cursor-change', cursorData)
}
</script>

<style scoped>
.section-container {
  @apply bg-white dark:bg-gray-800/60 rounded-lg shadow-sm hover:shadow-md 
         transition-all duration-300 overflow-hidden 
         border border-gray-200 dark:border-white/5 mb-6;
}

@keyframes container-shrink {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px);
    height: 0;
    margin: 0;
    padding: 0;
    border-width: 0px;
  }
}

.deleting {
  animation: container-shrink 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
  will-change: transform, opacity;
}

.section-header {
  @apply flex flex-col gap-3 py-4 px-5 bg-gray-50 dark:bg-gray-800/50 
         backdrop-blur-sm rounded-t-lg border-b border-gray-200 dark:border-white/5;
}

.section-title-row {
  @apply flex items-center justify-between w-full;
}

.section-title-input {
  @apply bg-transparent text-gray-800 dark:text-white font-medium text-lg 
         focus:outline-none focus:border-b focus:border-blue-400
         px-2 py-1 max-w-[150px] transition-all duration-200;
}

.add-line-button {
  @apply w-full flex items-center justify-center gap-2 py-3 
         text-blue-600 dark:text-blue-400 
         hover:bg-gray-50 dark:hover:bg-gray-700/30 
         active:bg-gray-100 dark:active:bg-gray-700/50
         transition-all duration-200 font-medium;
}

.section-drag-handle {
  @apply p-1.5 text-gray-600 dark:text-gray-400 
         bg-gray-100 dark:bg-gray-700/50 
         hover:bg-gray-200 dark:hover:bg-gray-700 
         active:bg-gray-300 dark:active:bg-gray-600
         rounded-md cursor-grab transition-all
         hover:scale-105 active:scale-95;
  touch-action: none !important;
  -webkit-touch-callout: none !important;
  user-select: none !important;
  -webkit-tap-highlight-color: transparent;
}

.drag-icon {
  @apply opacity-70 transition-opacity;
  pointer-events: none;
}

.section-drag-handle:hover .drag-icon {
  @apply opacity-100;
}

.delete-section-button {
  @apply p-1.5 rounded-full text-gray-500 hover:text-red-500 
         hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors;
}

.section-actions {
  @apply flex items-center gap-1;
}

.lyric-lines {
  @apply divide-y divide-gray-100 dark:divide-gray-700/50;
}

.line-wrapper {
  @apply py-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200;
}

/* Apple-like spring animation for newly added lines */
@keyframes line-spring-in {
  0% { 
    opacity: 0;
    transform: translateY(15px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
}

.newly-added {
  animation: line-spring-in 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.line-drag-handle {
  touch-action: none !important;
  -webkit-touch-callout: none !important;
  cursor: grab !important;
}

/* Mobile view adjustments */
@media (max-width: 768px) {
  .section-title-input {
    @apply text-base;
  }
  
  .section-header {
    @apply py-3 px-4;
  }
  
  .section-drag-handle, 
  .delete-section-button {
    @apply p-2;
  }
}

/* Stile für das Ziehen von Zeilen */
.dragging-line {
  @apply shadow-lg bg-white dark:bg-gray-800 border border-blue-400/70 dark:border-blue-500/70 
         z-50 rounded-md !important;
  transform: scale(1.02) rotate(-0.5deg);
  cursor: grabbing !important;
  position: fixed;
  will-change: transform;
  pointer-events: none;
}
</style> 