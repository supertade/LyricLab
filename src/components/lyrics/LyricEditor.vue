<template>
  <div class="editor-container">
    <!-- Sections Container -->
    <div class="sections-container">
      <draggable 
        v-model="song.sections" 
        class="sections-list"
        handle=".section-drag-handle"
        @start="onSectionStart"
        @end="onSectionMove"
        item-key="id"
        :animation="300"
        ghost-class="ghost-section-active"
        drag-class="dragging-section-active"
        chosen-class="chosen-section-active"
        group="sections"
        :delay="30"
        :delayOnTouchOnly="true"
        :forceFallback="true"
        :fallbackClass="'dragging-section'"
        :fallbackOnBody="false"
        :fallbackOffset="{x:0, y:0}"
        :fallbackTolerance="2"
        :scroll="true"
        :scrollSensitivity="100"
        :scrollSpeed="15"
        :sort="true"
        :no-transition-on-drag="true"
      >
        <template #item="{ element: section }">
          <div 
            :ref="el => registerSectionRef(section.id, el)"
            :data-section-id="section.id"
            :class="[
              'section-container section-wrapper mb-3 transition-all overflow-hidden origin-top',
              {
                'deleting-section': isDeletingSection(section.id),
                'newly-added-section': isNewlyAddedSection(section.id),
                'pointer-events-none': isDeletingSection(section.id)
              }
            ]"
          >
            <!-- Render NoteBlock for note type sections -->
            <NoteBlock 
              v-if="section.type === 'note'"
              :note="section"
              :isCollaborative="isCollaborative"
              :currentUserId="currentUserId"
              :currentUserColor="currentUserColor"
              :sessionId="sessionId"
              @update:note="handleNoteUpdate"
              @delete-note="deleteSection"
              @author-change="handleSectionAuthorChange"
              @cursor-change="handleCursorChange"
            />
            
            <!-- Render LyricSection for other section types -->
            <LyricSection 
              v-else
              :section="section"
              :isCollaborative="isCollaborative"
              :currentUserId="currentUserId"
              :currentUserColor="currentUserColor"
              :sessionId="sessionId"
              @update:section="updateSong"
              @delete-section="deleteSection"
              @add-line="addLine"
              @delete-line="deleteLine"
              @save-recording="handleSaveRecording"
              @delete-recording="handleDeleteRecording"
              @author-change="handleAuthorChange"
              @cursor-change="handleCursorChange"
            />
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick, onBeforeUpdate } from 'vue'
import { useFileManager } from '../../stores/fileManager'
import draggable from 'vuedraggable'
import LyricSection from './LyricSection.vue'
import NoteBlock from './NoteBlock.vue'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps({
  song: {
    type: Object,
    required: true
  },
  isCollaborative: {
    type: Boolean,
    default: false
  },
  // Collaboration props
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

const emit = defineEmits(['update:song', 'update-song', 'cursor-change'])
const fileManager = useFileManager()
const lastAddedSectionId = ref(null)
const sectionCount = ref(0)
const deletingSectionId = ref(null)
const sectionsWithDeletionAnimation = ref(new Set())
const isDragging = ref(false)

// FLIP Animation References and State
const sectionRefs = ref({})
const sectionPositions = ref({})
const isAnimating = ref(false)

// Register Section Refs for FLIP Animation
const registerSectionRef = (id, el) => {
  if (el) {
    sectionRefs.value[id] = el
  }
}

// Save positions before updates
onBeforeUpdate(() => {
  // Save current positions of all sections
  Object.entries(sectionRefs.value).forEach(([id, el]) => {
    if (el) {
      sectionPositions.value[id] = el.getBoundingClientRect()
    }
  })
  
  // Reset refs
  sectionRefs.value = {}
})

// Execute FLIP Animation
const applyFLIPAnimation = () => {
  // Avoid race conditions
  nextTick(() => {
    // Protect against too frequent calls
    if (isAnimating.value) return
    isAnimating.value = true
    
    // Wait until DOM is fully updated
    setTimeout(() => {
      Object.entries(sectionRefs.value).forEach(([id, el]) => {
        if (!el || !sectionPositions.value[id]) return
        
        // Skip for the section being deleted
        if (isDeletingSection(id)) return
        
        const oldPos = sectionPositions.value[id]
        const newPos = el.getBoundingClientRect()
        
        // Calculate the offset
        const deltaY = oldPos.top - newPos.top
        
        // Only if significant position change
        if (Math.abs(deltaY) > 3) {
          // Calculate position more precisely to avoid small jumps
          const preciseDelta = Math.round(deltaY)
          
          // Synchronize flows with RAF
          requestAnimationFrame(() => {
            // First: Set position (without animation)
            el.style.transform = `translateY(${preciseDelta}px)`
            el.style.transition = 'none'
            
            // Last: Animate to final position
            requestAnimationFrame(() => {
              el.style.transition = 'transform 400ms cubic-bezier(0.2, 0.9, 0.2, 1)'
              el.style.transform = 'translateY(0)'
              
              // Clean up after animation ends
              const onTransitionEnd = () => {
                el.style.transition = ''
                el.style.transform = ''
                el.removeEventListener('transitionend', onTransitionEnd)
              }
              
              // Event listener for exact timing
              el.addEventListener('transitionend', onTransitionEnd)
              
              // Fallback if transitionend doesn't fire
              setTimeout(() => {
                el.style.transition = ''
                el.style.transform = ''
              }, 450)
            })
          })
        }
      })
      
      // Mark animation as completed
      setTimeout(() => {
        isAnimating.value = false
      }, 500)
    }, 10) // Reduced timeout for faster response
  })
}

// Track section count for animation detection
watch(() => props.song.sections.length, (newCount, oldCount) => {
  if (newCount > sectionCount.value) {
    // A new section was added, track its ID for animation
    nextTick(() => {
      if (props.song.sections.length > 0) {
        const newSection = props.song.sections[props.song.sections.length - 1]
        lastAddedSectionId.value = newSection.id
        
        // Reset after animation completes
        setTimeout(() => {
          lastAddedSectionId.value = null
        }, 1000)
      }
    })
  } else if (newCount < oldCount) {
    // Section was removed, start FLIP animation
    applyFLIPAnimation()
  }
  sectionCount.value = newCount
})

/**
 * Check if section was newly added to apply animation
 */
const isNewlyAddedSection = (sectionId) => {
  return lastAddedSectionId.value === sectionId
}

/**
 * Check if section is being deleted to apply animation
 */
const isDeletingSection = (sectionId) => {
  return sectionsWithDeletionAnimation.value.has(sectionId)
}

/**
 * Add a new section of the specified type
 */
const addSection = (type) => {
  fileManager.addSection(type)
}

/**
 * Add a new line to the specified section
 */
const addLine = (sectionId) => {
  if (props.isCollaborative) {
    // In collaborative mode, modify the song data directly and emit update
    collaboration('➕ Adding line in collaboration mode to section:', sectionId)
    
    const section = props.song.sections.find(s => s.id === sectionId)
    if (!section) return
    
    const newLine = {
      id: Date.now(),
      text: '',
      syllables: 0
    }
    
    section.lines.push(newLine)
    emit('update-song', props.song)
  } else {
    // In normal mode, use fileManager
    fileManager.addLine(sectionId)
  }
}

/**
 * Delete a line from a section
 */
const deleteLine = (sectionId, lineId) => {
  if (props.isCollaborative) {
    // In collaborative mode, modify the song data directly and emit update
    collaboration('🗑️ Deleting line in collaboration mode:', lineId, 'from section:', sectionId)
    
    const section = props.song.sections.find(s => s.id === sectionId)
    if (!section) return
    
    const lineIndex = section.lines.findIndex(l => l.id === lineId)
    if (lineIndex !== -1) {
      section.lines.splice(lineIndex, 1)
      emit('update-song', props.song)
    }
  } else {
    // In normal mode, use fileManager
    fileManager.deleteLine(sectionId, lineId)
  }
}

/**
 * Delete a section with animation
 */
const deleteSection = (sectionId, event) => {
  // Prevent browser's default confirmation dialog
  if (event) event.preventDefault()
  
  if (isAnimating.value) {
    // Direkt löschen ohne Animation, falls bereits eine Animation läuft
    if (props.isCollaborative) {
      // In collaborative mode, modify the song data directly and emit update
      const sectionIndex = props.song.sections.findIndex(s => s.id === sectionId)
      if (sectionIndex !== -1) {
        props.song.sections.splice(sectionIndex, 1)
        emit('update-song', props.song)
      }
    } else {
      fileManager.deleteSection(sectionId)
    }
    return
  }
  
  isAnimating.value = true
  
  // Positionen speichern vor der Animation
  Object.entries(sectionRefs.value).forEach(([id, el]) => {
    if (el) {
      sectionPositions.value[id] = el.getBoundingClientRect()
    }
  })
  
  // Add to deletion animation set
  sectionsWithDeletionAnimation.value.add(sectionId)
  deletingSectionId.value = sectionId
  
  // Remove from animation set and actually delete after animation completes
  setTimeout(() => {
    if (props.isCollaborative) {
      // In collaborative mode, modify the song data directly and emit update
      collaboration('🗑️ Deleting section in collaboration mode:', sectionId)
      const sectionIndex = props.song.sections.findIndex(s => s.id === sectionId)
      if (sectionIndex !== -1) {
        props.song.sections.splice(sectionIndex, 1)
        emit('update-song', props.song)
      }
    } else {
      fileManager.deleteSection(sectionId)
    }
    
    // Nach dem tatsächlichen Löschen etwas warten, bevor wir den Animations-Flag zurücksetzen
    setTimeout(() => {
      sectionsWithDeletionAnimation.value.delete(sectionId)
      deletingSectionId.value = null
      isAnimating.value = false
    }, 100)
  }, 500) // Leicht reduzierte Dauer für schnelleres Feedback
}

/**
 * Update the song in the store
 */
const updateSong = () => {
  if (props.isCollaborative) {
    // In collaborative mode, emit the update for real-time sync
    collaboration('🔄 Real-time collaborative update:', props.song.title)
    emit('update-song', props.song)
  } else {
    // In normal mode, save locally AND to cloud (dual storage)
    sync('💾 Dual storage update (local + cloud):', props.song.title)
    fileManager.updateSong(props.song)
  }
}

/**
 * Handle section move event when drag ends
 */
const onSectionMove = (event) => {
  // Check if there was an actual movement
  if (event.oldIndex !== event.newIndex) {
    isDragging.value = false
    
    debug('Moving section from', event.oldIndex, 'to', event.newIndex);
    debug('Sections order:', props.song.sections.map(s => s.title).join(', '));
    
    // Update the song
    try {
      updateSong();
    } catch (err) {
      error('Error updating song after section move:', err);
    }
  }
}

/**
 * Handle drag start event for sections
 */
const onSectionStart = () => {
  isDragging.value = true
}

/**
 * Save a recording for a section
 */
const handleSaveRecording = (sectionId, audioBlob, metadata) => {
  if (props.isCollaborative) {
    // In collaborative mode, modify the song data directly and emit update
    collaboration('🎵 Saving recording in collaboration mode to section:', sectionId)
    
    const section = props.song.sections.find(s => s.id === sectionId)
    if (!section) return
    
    const reader = new FileReader()
    reader.readAsDataURL(audioBlob)
    reader.onloadend = () => {
      if (!reader.result) return
      
      const base64data = reader.result.toString()
      section.recording = {
        id: Date.now(),
        data: base64data,
        timestamp: new Date().toISOString(),
        duration: metadata.duration || 0
      }
      emit('update-song', props.song)
    }
  } else {
    // In normal mode, use fileManager
    fileManager.saveRecording(sectionId, audioBlob, metadata)
  }
}

/**
 * Delete a recording from a section
 */
const handleDeleteRecording = (sectionId) => {
  if (props.isCollaborative) {
    // In collaborative mode, modify the song data directly and emit update
    collaboration('🗑️ Deleting recording in collaboration mode from section:', sectionId)
    
    const section = props.song.sections.find(s => s.id === sectionId)
    if (!section) return
    
    section.recording = null
    emit('update-song', props.song)
  } else {
    // In normal mode, use fileManager
    fileManager.deleteRecording(sectionId)
  }
}

/**
 * Handle authorship changes for collaboration
 */
const handleAuthorChange = (authorData) => {
  if (props.isCollaborative) {
    collaboration('👤 Setting line authorship:', authorData)
    
    // Update the line with authorship information
    const section = props.song.sections.find(s => s.id === authorData.sectionId)
    if (section) {
      const line = section.lines.find(l => l.id === authorData.lineId)
      if (line) {
        // Set authorship information
        if (!line.authorId || authorData.isModification) {
          line.authorId = authorData.authorId
          line.authorColor = authorData.authorColor
          line.lastModifiedBy = authorData.authorId
          line.lastModifiedAt = new Date().toISOString()
          
          // Emit song update for real-time sync
          emit('update-song', props.song)
        }
      }
    }
  }
}

/**
 * Handle authorship changes for sections (notes)
 */
const handleSectionAuthorChange = (authorData) => {
  if (props.isCollaborative) {
    collaboration('👤 Setting section authorship:', authorData)
    
    // Update the section with authorship information
    const section = props.song.sections.find(s => s.id === authorData.sectionId)
    if (section) {
      // Set authorship information
      if (!section.authorId || authorData.isModification) {
        section.authorId = authorData.authorId
        section.authorColor = authorData.authorColor
        section.lastModifiedBy = authorData.authorId
        section.lastModifiedAt = new Date().toISOString()
        
        // Emit song update for real-time sync
        emit('update-song', props.song)
      }
    }
  }
}

/**
 * Handle cursor changes for collaboration
 */
const handleCursorChange = (cursorData) => {
  if (props.isCollaborative) {
    emit('cursor-change', cursorData)
  }
}

/**
 * Handle note updates correctly
 */
const handleNoteUpdate = (updatedNote) => {
  if (props.isCollaborative) {
    collaboration('📝 Updating note in collaboration mode:', updatedNote.id)
    
    // Find and update the specific section in the song
    const sectionIndex = props.song.sections.findIndex(s => s.id === updatedNote.id)
    if (sectionIndex !== -1) {
      // Update the section with the new note content
      props.song.sections[sectionIndex] = updatedNote
      
      // Emit song update for real-time sync
      emit('update-song', props.song)
    }
  } else {
    // In normal mode, update the section and save
    const sectionIndex = props.song.sections.findIndex(s => s.id === updatedNote.id)
    if (sectionIndex !== -1) {
      props.song.sections[sectionIndex] = updatedNote
      fileManager.updateSong(props.song)
    }
  }
}

// Initialize section count on mount
onMounted(() => {
  sectionCount.value = props.song.sections.length
})
</script>

<style scoped>
.editor-container {
  @apply min-h-full bg-gray-50 dark:bg-gray-900 p-3;
  height: 100%;
  overflow-y: auto;
  padding-bottom: 6rem;
}

.sections-container {
  position: relative;
}

.sections-list {
  display: flex;
  flex-direction: column;
}

.section-container {
  position: relative;
  will-change: transform;
}

.section-wrapper {
  transition-property: height, margin, padding, opacity, transform;
  transition-duration: 500ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.ghost-section-active {
  @apply opacity-80 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-400 dark:border-blue-500 
         shadow-md z-10 rounded-lg scale-[1.02];
  transition: transform 0.2s cubic-bezier(0.2, 0, 0, 1);
  box-shadow: 0 0 15px rgba(37, 99, 235, 0.15);
}

.dragging-section-active {
  @apply shadow-xl bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 z-50 rounded-lg;
  transform: rotate(0.5deg) scale(1.03);
  will-change: transform;
  transition: none !important;
  position: relative;
  cursor: grabbing !important;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
  -webkit-font-smoothing: antialiased;
  backface-visibility: hidden;
  perspective: 1000px;
}

.chosen-section-active {
  @apply shadow-md z-30 scale-105;
  transition: all 0.2s cubic-bezier(0.2, 0, 0, 1);
}

/* Apple-style spring animation for new sections */
@keyframes section-spring-in {
  0% {
    opacity: 0;
    transform: translate3d(0, 20px, 0) scale3d(0.95, 0.95, 1);
    filter: blur(2px);
  }
  60% {
    opacity: 1;
    filter: blur(0);
    transform: translate3d(0, -2px, 0) scale3d(1, 1, 1);
  }
  100% {
    transform: translate3d(0, 0, 0) scale3d(1, 1, 1);
  }
}

.newly-added-section {
  animation: section-spring-in 0.5s cubic-bezier(0.2, 0.9, 0.4, 1) forwards;
  will-change: transform, opacity;
  transform-origin: center top;
  backface-visibility: hidden;
  perspective: 1000px;
  -webkit-font-smoothing: antialiased;
}

/* Section deletion animation - improved for smoother collapse */
.deleting-section {
  animation: section-collapse 500ms cubic-bezier(0.25, 0.8, 0.4, 1) forwards;
  will-change: transform, opacity, height, margin, padding;
  overflow: hidden;
  pointer-events: none;
  z-index: 10;
}

@keyframes section-collapse {
  0% {
    opacity: 1;
    max-height: 1000px; /* arbitrary large value */
    margin-bottom: 0.75rem;
    transform: translateY(0) scale(1);
  }
  40% {
    opacity: 0.7;
    margin-bottom: 0.5rem;
    transform: translateY(-4px) scale(0.99);
  }
  100% {
    opacity: 0;
    max-height: 0;
    margin-bottom: 0;
    padding-top: 0;
    padding-bottom: 0;
    transform: translateY(-8px) scale(0.97);
  }
}

/* Touch-friendly styles */
button {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

input {
  touch-action: manipulation;
}

.section-drag-handle {
  touch-action: none !important;
  -webkit-touch-callout: none !important;
  cursor: grab !important;
}
</style> 