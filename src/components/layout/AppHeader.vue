<template>
  <div>
    <!-- Main Header -->
    <div class="pt-safe *:py-3 px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between sticky top-0 z-50 transition-all duration-300 shadow-sm">
      <div class="flex items-center gap-2">
        <button 
          @click="emit('toggle-song-list')" 
          class="p-2 rounded-full text-gray-600 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
          aria-label="Open song list"
        >
          <Icon name="menu" :size="20" />
        </button>
        
        <div v-if="currentSong" class="flex items-center">
          <h1 class="text-xl font-medium text-gray-800 dark:text-white group flex items-center gap-2">
            <template v-if="!editingTitle">
              <span @click="startEditingTitle" class="cursor-pointer group-hover:opacity-80 transition-opacity">
                {{ currentSong.title }}
              </span>
              <button 
                @click="startEditingTitle"
                class="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                aria-label="Edit title"
              >
                <Icon name="edit" :size="16" />
              </button>
            </template>
            <input
              v-else
              id="song-title-input"
              v-model="tempTitle"
              @blur="saveTitle"
              @keyup.enter="saveTitle"
              @keyup.esc="cancelEditing"
              class="bg-transparent text-xl font-medium text-gray-800 dark:text-white border-b border-gray-300 dark:border-white/20 focus:border-blue-500 dark:focus:border-blue-400 outline-none px-0 py-0.5 w-64"
              placeholder="Enter song title..."
              aria-label="Song title"
            />
          </h1>
        </div>
        <h1 v-else class="text-xl font-medium text-gray-800 dark:text-white">
          Lyrics
        </h1>
      </div>
      
      <div class="flex items-center gap-2">
        <!-- Share & Collaborate Button -->
        <button 
          v-if="currentSong"
          @click="openShareModal"
          class="relative flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200"
          :class="{ 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30': isSharing }"
          title="Share & Collaborate"
        >
          <!-- Users/Collaboration Icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          
          <!-- Active Collaboration Indicator -->
          <div 
            v-if="isSharing" 
            class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"
            title="Active Collaboration"
          ></div>
        </button>
        
        <!-- Settings Link -->
        <router-link 
          to="/settings" 
          class="p-2 rounded-full text-gray-600 hover:bg-gray-200/70 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
          aria-label="Settings"
        >
          <Icon name="settings" :size="20" />
        </router-link>
        
        <button 
          v-if="currentSong" 
          @click="confirmDelete" 
          class="p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
          aria-label="Delete song"
        >
          <Icon name="trash" :size="20" />
        </button>
      </div>
    </div>

    <!-- Toggle details button - positioned between header and contents -->
    <div 
      v-if="currentSong"
      class="flex justify-center py-1 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xl"
    >
      <div 
        @click="toggleSongDetails" 
        class="w-8 h-0.5 bg-gray-400/60 dark:bg-gray-400/40 rounded-full cursor-pointer"
        aria-label="Toggle song details"
      ></div>
    </div>

    <!-- Expanded song details section -->
    <div 
      v-if="currentSong"
      class="px-5 pb-4 pt-3 bg-gray-50/95 dark:bg-gray-800/95 backdrop-blur-xl border-b border-gray-200/30 dark:border-gray-700/30 transition-all duration-300 overflow-hidden"
      :class="{ 'max-h-0 py-0 opacity-0 border-b-0': !isExpanded, 'max-h-24 opacity-100': isExpanded }"
    >
      <div class="grid grid-cols-2 gap-5">
        <!-- BPM Input -->
        <div>
          <div class="flex items-center mb-1.5">
            <label for="song-bpm" class="text-xs font-medium text-gray-500 dark:text-gray-400">
              BPM
            </label>
          </div>
          <input
            id="song-bpm"
            type="number"
            inputmode="numeric"
            v-model="songBpm"
            @blur="saveSongDetails"
            @keyup.enter="saveSongDetails"
            placeholder="e.g. 120"
            class="w-full px-3 py-2 rounded-xl bg-gray-200/50 dark:bg-gray-700/40 border-0 focus:ring-1 focus:ring-blue-500/20 focus:bg-gray-100/70 dark:focus:bg-gray-600/50 outline-none text-gray-800 dark:text-white text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          />
        </div>
        
        <!-- Key Input -->
        <div>
          <div class="flex items-center mb-1.5">
            <label for="song-key" class="text-xs font-medium text-gray-500 dark:text-gray-400">
              Key
            </label>
          </div>
          <input
            id="song-key"
            type="text"
            v-model="songKey"
            @blur="saveSongDetails"
            @keyup.enter="saveSongDetails"
            placeholder="e.g. C#m"
            class="w-full px-3 py-2 rounded-xl bg-gray-200/50 dark:bg-gray-700/40 border-0 focus:ring-1 focus:ring-blue-500/20 focus:bg-gray-100/70 dark:focus:bg-gray-600/50 outline-none text-gray-800 dark:text-white text-sm shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
          />
        </div>
      </div>
    </div>



    <!-- Share Modal -->
    <div v-if="showShareModal" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        @click="closeShareModal"
      ></div>

      <!-- Modal Content -->
      <div class="relative bg-white dark:bg-gray-900 w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-t-2xl sm:rounded-2xl shadow-2xl transform transition-all">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <Icon name="users" :size="20" class="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ isSharing ? 'Manage Collaboration' : 'Start Collaboration' }}
              </h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ currentSong?.title || 'Untitled Song' }}
              </p>
            </div>
          </div>
          
          <button
            @click="closeShareModal"
            class="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
          >
            <Icon name="close" :size="16" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <!-- Not sharing yet -->
          <div v-if="!isSharing" class="text-center">
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              Create a collaboration link to work on this song together in real-time.
            </p>
            
            <button
              @click="createCollaboration"
              :disabled="isLoading"
              class="w-full flex items-center justify-center gap-3 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <div v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <Icon v-else name="users" :size="18" />
              {{ isLoading ? 'Creating...' : 'Create Collaboration' }}
            </button>
          </div>

          <!-- Already sharing -->
          <div v-else>
            <!-- Share Link -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Collaboration Link
              </label>
              <div class="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <input
                  ref="linkInput"
                  :value="shareLink"
                  readonly
                  class="flex-1 bg-transparent text-sm font-mono text-gray-900 dark:text-white outline-none"
                />
                <button
                  @click="copyLink"
                  class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
                  :class="copyStatus === 'copied' 
                    ? 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30' 
                    : 'text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'"
                >
                  {{ copyStatus === 'copied' ? 'Copied!' : 'Copy' }}
                </button>
              </div>
            </div>

            <!-- Quick Share Actions -->
            <div class="grid grid-cols-2 gap-3 mb-6">
              <button
                @click="shareViaWhatsApp"
                class="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="share" :size="16" />
                WhatsApp
              </button>
              
              <button
                @click="shareViaEmail"
                class="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="mail" :size="16" />
                E-Mail
              </button>
            </div>

            <!-- Join Collaboration Button -->
            <button
              @click="joinOwnCollaboration"
              class="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors mb-3"
            >
              <div class="flex items-center justify-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Join Collaboration
              </div>
            </button>

            <!-- Stop Collaboration -->
            <button
              @click="stopCollaboration"
              class="w-full py-2 px-4 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Stop Collaboration
            </button>
          </div>
        </div>

        <!-- Handle for mobile -->
        <div class="flex justify-center pb-2 sm:hidden">
          <div class="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>
      </div>
    </div>

    <!-- Collaboration Indicator -->
    <CollaborationIndicator 
      v-if="collaborationSession"
      :session="collaborationSession"
      :current-user-id="userStore.userId || ''"
      :show-cursors="true"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../ui/Icon.vue'
import { useFileManager } from '../../stores/fileManager'
import { useUserStore } from '../../stores/user'
import firebaseAuth from '../../services/firebase'
import { useAppConfirm } from '../../composables/useAppConfirm'
import { collaborationService } from '../../services/collaboration'
import ShareButton from '../collaboration/ShareButton.vue'
import CollaborationIndicator from '../collaboration/CollaborationIndicator.vue'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-song-list', 'toggle-dark-mode', 'delete-current-song', 'modal-state-changed'])
const router = useRouter()
const fileManager = useFileManager()
const userStore = useUserStore()
const editingTitle = ref(false)
const tempTitle = ref('')
const { confirmDelete: showDeleteConfirm } = useAppConfirm()

// Collaboration state
const collaborationSession = ref(null)
const showShareModal = ref(false)
const isSharing = ref(false)
const isLoading = ref(false)
const shareLink = ref('')
const linkInput = ref()
const copyStatus = ref('idle')

// Song details expansion state
const isExpanded = ref(false)
const songBpm = ref('')
const songKey = ref('')

// Use a computed property for currentSong instead of direct access
const currentSong = computed(() => fileManager.currentSong)

/**
 * Restore collaboration state from localStorage
 */
const restoreCollaborationState = (songId) => {
  try {
    const collaborationData = localStorage.getItem(`collaboration_${songId}`)
    if (collaborationData) {
      const data = JSON.parse(collaborationData)
      
      // Check if collaboration is not too old (24 hours)
      const hoursSinceCreated = (Date.now() - data.created) / (1000 * 60 * 60)
      if (hoursSinceCreated < 24) {
        shareLink.value = data.shareLink
        isSharing.value = true
        
        // Notify other components about existing collaboration
        window.dispatchEvent(new CustomEvent('collaboration-started', {
          detail: { songId: data.songId, sessionId: data.sessionId }
        }))
        
        collaboration('🔄 Restored collaboration state for song:', songId)
      } else {
        // Remove expired collaboration
        localStorage.removeItem(`collaboration_${songId}`)
        collaboration('🗑️ Removed expired collaboration for song:', songId)
      }
    }
  } catch (error) {
    collaboration('❌ Failed to restore collaboration state:', error)
  }
}

// Watch for changes in current song to update BPM and Key
watch(currentSong, (newSong) => {
  if (newSong) {
    songBpm.value = newSong.bpm || ''
    songKey.value = newSong.key || ''
    
    // Restore collaboration state from localStorage
    restoreCollaborationState(newSong.id)
  } else {
    songBpm.value = ''
    songKey.value = ''
    // Clear collaboration state when no song is selected
    isSharing.value = false
    shareLink.value = ''
  }
}, { immediate: true })

/**
 * Toggle the expanded song details section
 */
const toggleSongDetails = () => {
  isExpanded.value = !isExpanded.value
}

/**
 * Save the BPM and Key values to the song
 */
const saveSongDetails = () => {
  if (currentSong.value) {
    fileManager.updateSong({
      ...currentSong.value,
      bpm: songBpm.value,
      key: songKey.value
    })
  }
}

/**
 * Start editing the song title
 * Sets up temporary title and focuses the input field
 */
const startEditingTitle = () => {
  if (!currentSong.value) return
  
  tempTitle.value = currentSong.value.title
  editingTitle.value = true
  // Focus the input in the next tick after it's rendered
  nextTick(() => {
    document.getElementById('song-title-input')?.focus()
  })
}

/**
 * Save the edited song title
 * Updates the song with the new title if valid
 */
const saveTitle = () => {
  if (currentSong.value && tempTitle.value.trim()) {
    fileManager.updateSong({
      ...currentSong.value,
      title: tempTitle.value.trim()
    })
  }
  editingTitle.value = false
}

/**
 * Cancel title editing without saving changes
 */
const cancelEditing = () => {
  editingTitle.value = false
}

/**
 * Show the delete confirmation dialog
 */
const confirmDelete = async () => {
  if (!currentSong.value) return;
  
  await showDeleteConfirm({
    title: 'Delete Song',
    itemName: currentSong.value.title,
    confirmText: 'Delete',
    onConfirm: () => {
      emit('delete-current-song')
    }
  })
}

/**
 * Open share modal
 */
const openShareModal = () => {
  showShareModal.value = true
  emit('modal-state-changed', true)
}

/**
 * Close share modal
 */
const closeShareModal = () => {
  showShareModal.value = false
  emit('modal-state-changed', false)
}

/**
 * Create collaboration
 */
const createCollaboration = async () => {
  if (!currentSong.value || !userStore.userId || !userStore.userEmail) return

  // Check if email is verified before creating collaboration
  if (!firebaseAuth.isEmailVerified()) {
    alert('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse, um eine Kollaboration zu starten.')
    return
  }

  try {
    isLoading.value = true
    const link = await collaborationService.createCollaborationSession(
      currentSong.value, 
      userStore.userId, 
      userStore.userEmail
    )
    
    shareLink.value = link
    isSharing.value = true
    collaboration('✅ Collaboration created:', link)
    
    // Store active collaboration in localStorage for persistence
    const sessionId = link.split('/').pop()
    const collaborationData = {
      songId: currentSong.value.id,
      sessionId: sessionId,
      shareLink: link,
      created: Date.now()
    }
    localStorage.setItem(`collaboration_${currentSong.value.id}`, JSON.stringify(collaborationData))
    
    // Notify other components about collaboration start
    window.dispatchEvent(new CustomEvent('collaboration-started', {
      detail: { songId: currentSong.value.id, sessionId: sessionId }
    }))
    
    // Modal stays open to show link and sharing options
    
  } catch (error) {
    collaboration('❌ Failed to create collaboration:', error)
    
    // Provide specific error messages based on the error
    let errorMessage = 'Failed to create collaboration. Please try again.'
    
    if (error instanceof Error) {
      if (error.message.includes('permission-denied') || error.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'E-Mail-Bestätigung erforderlich. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Kollaborationen zu erstellen.'
      } else if (error.message.includes('network')) {
        errorMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.'
      } else {
        errorMessage = error.message
      }
    }
    
    alert(errorMessage)
  } finally {
    isLoading.value = false
  }
}

/**
 * Join own collaboration
 */
const joinOwnCollaboration = () => {
  if (shareLink.value) {
    closeShareModal()
    const sessionId = shareLink.value.split('/').pop()
    if (sessionId) {
      router.push(`/collaborate/${sessionId}`)
    }
  }
}

/**
 * Stop collaboration
 */
const stopCollaboration = async () => {
  try {
    if (shareLink.value) {
      const sessionId = shareLink.value.split('/').pop()
      if (sessionId && userStore.userId) {
        await collaborationService.leaveCollaborationSession(sessionId, userStore.userId)
      }
    }
    
    // Remove from localStorage
    if (currentSong.value) {
      localStorage.removeItem(`collaboration_${currentSong.value.id}`)
      
      // Notify other components about collaboration stop
      window.dispatchEvent(new CustomEvent('collaboration-stopped', {
        detail: { songId: currentSong.value.id }
      }))
    }
    
    isSharing.value = false
    shareLink.value = ''
    collaboration('✅ Collaboration stopped',19759)
    
  } catch (error) {
    collaboration('❌ Failed to stop collaboration:', error)
  }
}

/**
 * Copy link to clipboard
 */
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copyStatus.value = 'copied'
    
    setTimeout(() => {
      copyStatus.value = 'idle'
    }, 2000)
  } catch (error) {
    // Fallback for older browsers
    if (linkInput.value) {
      linkInput.value.select()
      document.execCommand('copy')
      copyStatus.value = 'copied'
      setTimeout(() => {
        copyStatus.value = 'idle'
      }, 2000)
    }
  }
}

/**
 * Share via WhatsApp
 */
const shareViaWhatsApp = () => {
  const message = `🎵 Let's collaborate on "${currentSong.value?.title}" in LyricLab!\n\nJoin here: ${shareLink.value}`
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

/**
 * Share via Email
 */
const shareViaEmail = () => {
  const subject = `Collaborate on "${currentSong.value?.title}" - LyricLab`
  const body = `Hi!\n\nI'd like to invite you to collaborate with me on the song "${currentSong.value?.title}" using LyricLab.\n\nClick this link to join the real-time collaboration:\n${shareLink.value}\n\nYou can edit lyrics, add sections, and record audio ideas together in real-time!\n\nBest regards`
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailtoUrl
}

/**
 * Handle collaboration started event
 */
const handleCollaborationStarted = (sessionId, shareLink) => {
  collaboration('Collaboration started:', sessionId, shareLink)
  // You could store the session info here for the indicator
}

/**
 * Handle collaboration stopped event
 */
const handleCollaborationStopped = () => {
  collaboration('Collaboration stopped',21584)
  collaborationSession.value = null
}
</script>

<style scoped>
/* Fade transition for modal */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Fix overflow for expanded details panel */
.max-h-0 {
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
}
</style> 