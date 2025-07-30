<template>
  <div class="flex flex-col h-full bg-white dark:bg-gray-900">
    <!-- Clean Song Editor Container -->
    <div class="flex-1 overflow-hidden">
      <LyricEditor 
        v-if="song"
        :song="song"
        :isCollaborative="true"
        :currentUserId="currentUserId"
        :currentUserColor="currentUserColor"
        :sessionId="session?.id || ''"
        @update-song="handleSongUpdate"
        @cursor-change="handleCursorChange"
      />
    </div>
    
        <!-- Floating Action Button for adding new blocks -->
    <FloatingAddBlockButton 
      v-if="song"
      @add-block="addNewSection"
    />

    <!-- Live Collaboration Indicators -->
    <div class="absolute inset-0 pointer-events-none z-20">
      <!-- Other Users' Cursors -->
      <div 
        v-for="collaborator in otherCollaborators" 
        :key="`cursor-${collaborator.uid}`"
        v-show="collaborator.cursor && isConnected"
        class="absolute transition-all duration-300 ease-out"
        :style="getCursorStyle(collaborator.cursor, collaborator.color)"
      >
        <!-- Cursor Line -->
        <div 
          class="w-0.5 h-5 rounded-full"
          :style="{ backgroundColor: collaborator.color }"
        ></div>
        
        <!-- User Label -->
        <div 
          class="absolute -top-7 left-0 px-2 py-0.5 text-xs font-medium text-white rounded-md shadow-sm whitespace-nowrap"
          :style="{ backgroundColor: collaborator.color }"
        >
          {{ getDisplayName(collaborator) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { collaborationService } from '../../services/collaboration'
import LyricEditor from './LyricEditor.vue'
import FloatingAddBlockButton from '../ui/FloatingAddBlockButton.vue'
import type { CollaborationUser } from '../../services/collaboration'
import type { Song } from '../../stores/fileManager'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '../../utils/logger'

interface Props {
  song: Song
  session: any
  currentUserId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  songUpdated: [song: Song]
}>()

// State
const isConnected = ref(false)

// Computed
const otherCollaborators = computed(() => {
  if (!props.session?.collaborators) return []
  return props.session.collaborators.filter((c: CollaborationUser) => c.uid !== props.currentUserId)
})

const currentUserColor = computed(() => {
  if (!props.session?.collaborators || !props.currentUserId) return '#6B7280'
  const currentUser = props.session.collaborators.find((c: CollaborationUser) => c.uid === props.currentUserId)
  return currentUser?.color || '#6B7280'
})

// Methods
const handleSongUpdate = (updatedSong: Song) => {
  try {
    emit('songUpdated', updatedSong)
  } catch (err) {
    collaboration('❌ Error handling song update:', err)
  }
}

const addNewSection = (type: string) => {
  if (!props.song) return
  
  collaboration('➕ Adding new section in collaboration:', type)
  
  // Create new section (Firebase-safe - no undefined values)
  const newSection: any = {
    id: Date.now(),
    type,
    title: generateSectionTitle(type, props.song.sections),
    lines: type === 'note' ? [] : [],
    recording: null
  }
  
  // Only add content field for note types (Firebase doesn't like undefined)
  if (type === 'note') {
    newSection.content = ''
  }
  
  // Add to song
  const updatedSong = {
    ...props.song,
    sections: [...props.song.sections, newSection]
  }
  
  sync('🔍 New section created (Firebase-safe):', newSection)
  
  // Emit the update for collaborative sync
  emit('songUpdated', updatedSong)
}

const handleCursorChange = async (cursor: { sectionId: string | number; lineId?: string | number; position: number }) => {
  try {
    if (props.session?.id && props.currentUserId) {
      await collaborationService.updateCursorPosition(props.session.id, props.currentUserId, cursor)
    }
  } catch (err) {
    error('Failed to update cursor position:', err)
  }
}

const getCursorStyle = (_cursor: CollaborationUser['cursor'], _color: string) => {
  // Simplified cursor positioning - in real implementation would calculate from DOM
  return {
    left: '100px',
    top: '100px',
    zIndex: 25
  }
}

const getDisplayName = (user: CollaborationUser): string => {
  if (user.displayName) {
    return user.displayName.split(' ')[0] // First name only
  }
  return user.email.split('@')[0].slice(0, 8) // Max 8 chars from email
}

const generateSectionTitle = (type: string, sections: any[]): string => {
  const sameTypeCount = sections.filter(s => s.type === type).length
  
  // Standardtitel für verschiedene Typen
  const typeLabels: Record<string, string> = {
    verse: 'Verse',
    chorus: 'Chorus',
    bridge: 'Bridge',
    intro: 'Intro',
    outro: 'Outro',
    pre_chorus: 'Pre-Chorus',
    post_chorus: 'Post-Chorus',
    hook: 'Hook',
    refrain: 'Refrain',
    note: 'Note'
  }
  
  const baseTitle = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)
  
  // Wenn es bereits Abschnitte dieses Typs gibt, nummerieren
  return sameTypeCount > 0 ? `${baseTitle} ${sameTypeCount + 1}` : baseTitle
}

// Listen to real-time song updates
const listenToSongUpdates = () => {
  if (!props.session?.id) return
  
  isConnected.value = true
  
  // Note: The main CollaborateView now handles song updates
  // This component focuses on cursor updates and UI reactivity
  collaboration('📡 CollaborativeSongEditor ready for real-time collaboration',4930)
}

// Watch for session changes
watch(() => props.session?.id, (newSessionId) => {
  if (newSessionId) {
    // Start collaboration UI
    listenToSongUpdates()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (props.session?.id) {
    listenToSongUpdates()
  }
})

onUnmounted(() => {
  collaboration('🧹 CollaborativeSongEditor unmounted',5310)
})
</script>