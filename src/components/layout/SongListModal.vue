<template>
  <transition name="modal-fade" appear>
    <div 
      v-if="visible"
      class="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-md z-50 flex items-start" 
      @click="emit('close')"
      aria-modal="true"
      role="dialog"
    >
      <div class="w-96 h-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg shadow-xl flex flex-col modal-content" @click.stop>
        <!-- Header with logo -->
        <div class="pt-safe px-6 pb-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-3">
            <!-- Logo -->
            <div class="w-8 h-8">
              <svg class="w-full h-full" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 4L8 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 16C8 17.6569 6.65685 19 5 19C3.34315 19 2 17.6569 2 16C2 14.3431 3.34315 13 5 13C6.65685 13 8 14.3431 8 16Z" stroke="currentColor" stroke-width="2"/>
                <path d="M8 4L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 10H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M14 14H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            
            <!-- Title -->
            <div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">My Songs</h2>
              <p class="text-xs text-[#0055cc] dark:text-blue-400">{{ songs.length }} Songs</p>
            </div>
          </div>
          
          <button @click="emit('close')" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
            <Icon name="close" :size="22" />
          </button>
        </div>

        <!-- Search area -->
        <div class="px-6 py-4">
          <div class="relative">
            <Icon name="search" :size="18" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search for songs..." 
              class="w-full bg-gray-100 dark:bg-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all duration-200"
              v-model="searchQuery"
            >
          </div>
          <div class="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            <Icon name="swipe-left" :size="14" class="mr-1 opacity-70" />
            <span>Swipe left to delete</span>
          </div>
        </div>

        <!-- Song List -->
        <div class="flex-1 overflow-y-auto px-4">
          <!-- My Songs Section -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3 px-2">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                My Songs
              </h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ filteredSongs.length }}
              </span>
            </div>
            
            <div class="space-y-2">
              <div 
                v-for="(song, index) in filteredSongs" 
                :key="song.id"
                class="rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden"
                :class="{ 'deleting': deletingSong === song.id }"
                @touchstart.passive="onTouchStart($event, song.id)"
                @touchmove.passive="onTouchMove($event, song.id)"
                @touchend.passive="onTouchEnd(song.id)"
              >
                <!-- Delete action revealed on swipe -->
                <div 
                  class="absolute inset-y-0 right-0 bg-red-500 text-white flex items-center justify-end pr-6 swipe-delete-area"
                  :style="{ 
                    width: swipeDeleteWidth + 'px', 
                    transform: songSwipeStyles[song.id] 
                      ? `translateX(${Math.max(0, swipeDeleteWidth + songSwipeStyles[song.id].offset)}px)` 
                      : `translateX(${swipeDeleteWidth}px)` 
                  }"
                >
                  <Icon name="trash" :size="18" />
                  <span class="ml-2 font-medium">Delete</span>
                </div>
                
                <!-- Song item -->
                <div 
                  class="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-all duration-150 bg-white dark:bg-gray-900/70 touch-pan-y touch-pan-x"
                  :class="{ 'bg-accent/10 hover:bg-accent/15': currentSongId === song.id }"
                  :style="songSwipeStyles[song.id] ? { transform: `translateX(${songSwipeStyles[song.id].offset}px)` } : {}"
                                    @click="handleSongClick(song)"
                >
                <div class="relative">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center text-white text-base font-semibold shadow-sm" :class="getRandomGradient(song.id)">
                    {{ song.title.charAt(0).toUpperCase() }}
                  </div>
                  <!-- Collaboration indicator -->
                  <div 
                    v-if="isCollaborationSong(song.id)" 
                    class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"
                    title="Active Collaboration"
                  ></div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <h3 class="font-medium text-gray-900 dark:text-white truncate">{{ song.title }}</h3>
                    <Icon 
                      v-if="isCollaborationSong(song.id)" 
                      name="users" 
                      :size="14" 
                      class="text-green-500 flex-shrink-0" 
                      title="Collaboration Active"
                    />
                  </div>
                  <div class="flex items-center gap-2">
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ getSectionInfo(song) }}</p>
                    <span 
                      v-if="isCollaborationSong(song.id)"
                      class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full"
                    >
                      Live
                    </span>
                  </div>
                    <div v-if="song.bpm || song.key" class="flex mt-1 gap-2">
                      <span v-if="song.bpm" class="inline-flex items-center text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                        <Icon name="time" :size="10" class="mr-1" /> {{ song.bpm }} BPM
                      </span>
                      <span v-if="song.key" class="inline-flex items-center text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
                        <Icon name="note" :size="10" class="mr-1" /> {{ song.key }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Collaborations Section -->
          <div v-if="collaborations.length > 0" class="mb-6">
            <div class="flex items-center justify-between mb-3 px-2">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Collaborations
              </h3>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ collaborations.length }}
              </span>
            </div>
            
            <div class="space-y-2">
              <div 
                v-for="collaboration in collaborations" 
                :key="`collab-${collaboration.id}`"
                class="rounded-xl transition-all duration-200 cursor-pointer group relative overflow-hidden"
                @touchstart.passive="onTouchStartCollab($event, collaboration.id)"
                @touchmove.passive="onTouchMoveCollab($event, collaboration.id)"
                @touchend.passive="onTouchEndCollab(collaboration)"
              >
                <!-- Delete action revealed on swipe -->
                <div 
                  class="absolute inset-y-0 right-0 bg-red-500 text-white flex items-center justify-end pr-6 swipe-delete-area"
                  :style="{ 
                    width: swipeDeleteWidth + 'px', 
                    transform: songSwipeStyles[collaboration.id] 
                      ? `translateX(${Math.max(0, swipeDeleteWidth + songSwipeStyles[collaboration.id].offset)}px)` 
                      : `translateX(${swipeDeleteWidth}px)` 
                  }"
                >
                  <Icon :name="isCollaborationOwner(collaboration) ? 'trash' : 'user-x'" :size="18" />
                  <span class="ml-2 font-medium">{{ isCollaborationOwner(collaboration) ? 'Stop' : 'Leave' }}</span>
                </div>

                <!-- Collaboration item -->
                <div 
                  class="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-all duration-150 bg-white dark:bg-gray-900/70 touch-pan-y touch-pan-x"
                  :style="songSwipeStyles[collaboration.id] ? { transform: `translateX(${songSwipeStyles[collaboration.id].offset}px)` } : {}"
                  @click="openCollaboration(collaboration)"
                >
                  <div class="relative">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold shadow-sm">
                      {{ collaboration.songTitle?.charAt(0).toUpperCase() || 'C' }}
                    </div>
                    <!-- Collaboration indicator -->
                    <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <h3 class="font-medium text-gray-900 dark:text-white truncate">{{ collaboration.songTitle || 'Shared Song' }}</h3>
                      <Icon name="users" :size="14" class="text-blue-500 flex-shrink-0" />
                      <!-- Owner indicator -->
                      <span v-if="isCollaborationOwner(collaboration)" class="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                        Owner
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {{ collaboration.collaborators?.length || 0 }} collaborators
                      </p>
                      <span class="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        Live
                      </span>
                    </div>
                  </div>

                  <!-- Delete button for collaborations (hover version) -->
                  <button
                    @click.stop="handleDeleteCollaboration(collaboration)"
                    class="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors duration-150 opacity-0 group-hover:opacity-100"
                  >
                    <Icon :name="isCollaborationOwner(collaboration) ? 'trash' : 'user-x'" :size="16" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-gray-200 dark:border-gray-800 p-4 pb-safe">
          <button 
            @click="createNewSong"
            class="new-song-button w-full flex items-center justify-center gap-2 py-2.5 text-white bg-blue-500 hover:bg-blue-600 active:bg-blue-700 shadow-sm hover:shadow-md rounded-lg transition-all duration-200 font-medium"
          >
            <Icon name="plus" :size="18" />
            <span>New Song</span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '../ui/Icon.vue'
import { useFileManager } from '../../stores/fileManager'
import { useAppConfirm } from '../../composables/useAppConfirm'
import { useUserStore } from '../../stores/user'
import { collaborationService } from '../../services/collaboration'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { getFirestore } from '../../services/firebase'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps({
  visible: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])
const router = useRouter()
const fileManager = useFileManager()
const userStore = useUserStore()
const { confirmDelete } = useAppConfirm()
const searchQuery = ref('')

const songs = computed(() => fileManager.songs)
const currentSongId = computed(() => fileManager.currentSongId)
const deletingSong = ref(null)
const collaborations = ref([])
const activeSessions = ref(new Set())

// Swipe delete functionality
const swipeDeleteWidth = ref(120)
const swipeThreshold = 80
const songSwipeStyles = reactive({})
const touchStartX = ref(0)
const currentTouchX = ref(0)
const currentSwipeSongId = ref(null)

/**
 * Initialize swipe styles for all songs and collaborations
 * Creates an entry in songSwipeStyles for each song and collaboration
 */
const initializeSwipeStyles = () => {
  if (!songs.value) return
  
  songs.value.forEach(song => {
    if (!songSwipeStyles[song.id]) {
      songSwipeStyles[song.id] = { offset: 0 }
    }
  })
  
  // Initialize swipe styles for collaborations
  collaborations.value.forEach(collaboration => {
    if (!songSwipeStyles[collaboration.id]) {
      songSwipeStyles[collaboration.id] = { offset: 0 }
    }
  })
}

// Watch for changes in the songs and collaborations arrays
watch(songs, () => {
  initializeSwipeStyles()
}, { immediate: true, deep: true })

watch(collaborations, () => {
  initializeSwipeStyles()
}, { immediate: true, deep: true })

// Watch for user changes to reload collaborations
watch(() => userStore.userId, (newUserId) => {
  if (newUserId) {
    loadCollaborations()
  } else {
    collaborations.value = []
  }
})

onMounted(() => {
  initializeSwipeStyles()
  loadCollaborations()
  loadActiveCollaborationsFromStorage()
})

// Watch for modal visibility to reload collaborations when opened
watch(() => props.visible, (isVisible) => {
  if (isVisible && userStore.userId) {
    loadCollaborations()
    loadActiveCollaborationsFromStorage()
  }
})

/**
 * Handle touch start event
 * Stores the starting position and song ID
 */
const onTouchStart = (event, songId) => {
  touchStartX.value = event.touches[0].clientX
  currentTouchX.value = touchStartX.value
  currentSwipeSongId.value = songId
  
  // Ensure the swipe style object exists
  if (!songSwipeStyles[songId]) {
    songSwipeStyles[songId] = { offset: 0 }
  }
}

/**
 * Handle touch move event
 * Calculates and applies swipe offset
 */
const onTouchMove = (event, songId) => {
  if (songId !== currentSwipeSongId.value) return
  
  currentTouchX.value = event.touches[0].clientX
  const diff = currentTouchX.value - touchStartX.value
  
  // Only allow left swipe (negative diff)
  if (diff < 0) {
    songSwipeStyles[songId].offset = diff
  } else {
    // If swiping right and we're already offset, allow returning to original position
    if (songSwipeStyles[songId].offset < 0) {
      songSwipeStyles[songId].offset = Math.min(0, diff)
    } else {
      songSwipeStyles[songId].offset = 0
    }
  }
}

/**
 * Handle touch end event
 * Determines if swipe threshold was passed and acts accordingly
 */
const onTouchEnd = (songId) => {
  if (songId !== currentSwipeSongId.value) return
  
  // If swiped far enough, trigger delete
  if (songSwipeStyles[songId].offset < -swipeThreshold) {
    // Animate to full delete position
    songSwipeStyles[songId].offset = -swipeDeleteWidth.value
    
    // Show deletion confirmation dialog
    const songToConfirm = songs.value.find(song => song.id === songId)
    if (songToConfirm) {
      handleDeleteSong(songId)
    }
    
    // Reset the swipe state after a brief delay
    setTimeout(() => {
      songSwipeStyles[songId].offset = 0
    }, 500)
  } else {
    // Reset position
    songSwipeStyles[songId].offset = 0
  }
  
  currentSwipeSongId.value = null
}

/**
 * Handle touch start event for collaborations
 */
const onTouchStartCollab = (event, collabId) => {
  touchStartX.value = event.touches[0].clientX
  currentTouchX.value = touchStartX.value
  currentSwipeSongId.value = collabId
  
  // Ensure the swipe style object exists
  if (!songSwipeStyles[collabId]) {
    songSwipeStyles[collabId] = { offset: 0 }
  }
}

/**
 * Handle touch move event for collaborations
 */
const onTouchMoveCollab = (event, collabId) => {
  if (collabId !== currentSwipeSongId.value) return
  
  currentTouchX.value = event.touches[0].clientX
  const diff = currentTouchX.value - touchStartX.value
  
  // Only allow left swipe (negative diff)
  if (diff < 0) {
    songSwipeStyles[collabId].offset = diff
  } else {
    // If swiping right and we're already offset, allow returning to original position
    if (songSwipeStyles[collabId].offset < 0) {
      songSwipeStyles[collabId].offset = Math.min(0, diff)
    } else {
      songSwipeStyles[collabId].offset = 0
    }
  }
}

/**
 * Handle touch end event for collaborations
 */
const onTouchEndCollab = (collaboration) => {
  const collabId = collaboration.id
  if (collabId !== currentSwipeSongId.value) return
  
  // If swiped far enough, trigger delete
  if (songSwipeStyles[collabId].offset < -swipeThreshold) {
    // Animate to full delete position
    songSwipeStyles[collabId].offset = -swipeDeleteWidth.value
    
    // Show deletion confirmation dialog
    handleDeleteCollaboration(collaboration)
    
    // Reset the swipe state after a brief delay
    setTimeout(() => {
      songSwipeStyles[collabId].offset = 0
    }, 500)
  } else {
    // Reset position
    songSwipeStyles[collabId].offset = 0
  }
  
  currentSwipeSongId.value = null
}

const gradients = [
  'from-accent to-accent-secondary',
  'from-accent-secondary to-accent',
  'from-accent to-accent-dark',
  'from-accent-darker to-accent',
  'from-accent-secondary to-accent-dark'
]

/**
 * Get a consistent gradient background for a song based on its ID
 */
const getRandomGradient = (id) => {
  const index = id % gradients.length
  return `bg-gradient-to-br ${gradients[index]}`
}

/**
 * Filter songs based on search query and exclude collaboration songs
 * Searches through titles and song content
 */
const filteredSongs = computed(() => {
  // Start with all songs, sorted with newest first (assuming higher IDs are newer)
  let songsToFilter = [...songs.value].sort((a, b) => b.id - a.id);
  
  // Remove collaboration songs from the regular songs list
  songsToFilter = songsToFilter.filter(song => !isCollaborationSong(song.id));
  
  // If no search query, return the sorted songs
  if (!searchQuery.value) return songsToFilter;
  
  // Filter by search query
  const query = searchQuery.value.toLowerCase();
  return songsToFilter.filter(song => 
    song.title.toLowerCase().includes(query) ||
    song.sections.some(section => 
      section.type.toLowerCase().includes(query) ||
      section.lines.some(line => 
        line.text.toLowerCase().includes(query)
      )
    )
  );
})

/**
 * Select a song and close the modal
 */
const selectSong = (song) => {
  fileManager.selectSong(song)
  emit('close')
}

/**
 * Handle song click - check for active collaboration
 */
const handleSongClick = (song) => {
  if (isCollaborationSong(song.id)) {
    // Join collaboration directly
    joinCollaboration(song)
  } else {
    // Normal song selection
    selectSong(song)
  }
}

/**
 * Join collaboration directly
 */
const joinCollaboration = (song) => {
  try {
    // Get collaboration data from localStorage
    const collaborationData = localStorage.getItem(`collaboration_${song.id}`)
    if (collaborationData) {
      const data = JSON.parse(collaborationData)
      
      // Check if collaboration is still valid (24 hours)
      const hoursSinceCreated = (Date.now() - data.created) / (1000 * 60 * 60)
      if (hoursSinceCreated < 24 && data.sessionId) {
        // Navigate directly to collaboration
        emit('close')
        router.push(`/collaborate/${data.sessionId}`)
        return
      } else {
        localStorage.removeItem(`collaboration_${song.id}`)
      }
    }
    
    // Fallback: No valid collaboration found, select song normally
    selectSong(song)
  } catch (error) {
    collaboration.error('❌ Failed to join collaboration:', error)
    // Fallback to normal song selection
    selectSong(song)
  }
}

/**
 * Create a new song and close the modal
 */
const createNewSong = async () => {
  try {
    sync('🎵 Creating new song with auto-sync...',17508)
    await fileManager.createNewSong()
    emit('close')
    debug('✅ New song created successfully',17622)
  } catch (error) {
    error('❌ Failed to create new song:', error)
    // Still close modal even if there was an error
    emit('close')
  }
}

/**
 * Prepare to delete a song by opening the confirmation dialog
 */
const handleDeleteSong = (id) => {
  const songToDelete = songs.value.find(song => song.id === id)
  if (songToDelete) {
    confirmDelete({
      title: 'Delete Song',
      itemName: songToDelete.title,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          sync('🗑️ Deleting song with auto-sync:', songToDelete.title)
          await fileManager.deleteSong(songToDelete.id)
          sync('✅ Song deleted successfully from local and cloud',18303)
        } catch (error) {
          error('❌ Failed to delete song:', error)
        }
      }
    })
  }
}

/**
 * Format section information for display
 * Creates a summary of the song's sections
 */
const getSectionInfo = (song) => {
  if (!song.sections || !song.sections.length) {
    return 'Empty'
  }

  const sectionCounts = song.sections.reduce((acc, section) => {
    const type = section.type
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  return Object.entries(sectionCounts)
    .map(([type, count]) => {
      const typeLabel = getTypeLabel(type)
      return `${count}× ${typeLabel}`
    })
    .join(' • ')
}

/**
 * Get readable section type names
 */
const getTypeLabel = (type) => {
  const labels = {
    'verse': 'Verse',
    'chorus': 'Chorus',
    'bridge': 'Bridge',
    'pre-chorus': 'Pre',
    'intro': 'Intro',
    'outro': 'Outro'
  }
  
  return labels[type] || type.charAt(0).toUpperCase() + type.slice(1)
}

/**
 * Load active collaborations for the current user
 */
const loadCollaborations = async () => {
  try {
    if (!userStore.userId) {
      return
    }
    
    
    // Load user's active collaborations from Firebase
    const userCollaborations = await collaborationService.getUserCollaborations(userStore.userId)
    
    // Transform collaborations to include song titles
    const collaborationsWithSongData = await Promise.all(
      userCollaborations.map(async (collaboration) => {
        try {
          // Try to get song title from shared_songs collection
          const firestore = await getFirestore()
          const sharedSongQuery = query(collection(firestore, 'shared_songs'), where('__name__', '==', collaboration.id))
          const sharedSongSnapshot = await getDocs(sharedSongQuery)
          
          let songTitle = 'Shared Song'
          if (!sharedSongSnapshot.empty) {
            const songData = sharedSongSnapshot.docs[0].data()
            songTitle = songData.title || 'Untitled Song'
          }
          
                     return {
             ...collaboration,
             songTitle,
             sessionId: collaboration.id || collaboration.sessionId
           }
        } catch (error) {
                     return {
             ...collaboration,
             songTitle: 'Shared Song',
             sessionId: collaboration.id || collaboration.sessionId
           }
        }
      })
    )
    
    collaborations.value = collaborationsWithSongData
  } catch (error) {
    collaboration.error('❌ Failed to load collaborations:', error)
    collaborations.value = []
  }
}

/**
 * Load active collaborations from localStorage
 */
const loadActiveCollaborationsFromStorage = () => {
  try {
    // Clear existing active sessions
    activeSessions.value.clear()
    
    // Go through all localStorage keys to find collaborations
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('collaboration_')) {
        try {
          const collaborationData = JSON.parse(localStorage.getItem(key) || '{}')
          
          // Check if collaboration is not too old (24 hours)
          const hoursSinceCreated = (Date.now() - collaborationData.created) / (1000 * 60 * 60)
          if (hoursSinceCreated < 24 && collaborationData.songId) {
            activeSessions.value.add(collaborationData.songId.toString())
          } else {  
            localStorage.removeItem(key)
          }
        } catch (error) {
          localStorage.removeItem(key)
        }
      }
    }
    
  } catch (error) {
    collaboration.error('❌ Failed to load active collaborations from storage:', error)
  }
}

/**
 * Open a collaboration session
 */
const openCollaboration = (collaborationData) => {
  emit('close')
  const sessionId = collaborationData.sessionId || collaborationData.id
  router.push(`/collaborate/${sessionId}`)
}

/**
 * Check if a song has an active collaboration
 */
const isCollaborationSong = (songId) => {
  return activeSessions.value.has(songId.toString())
}

/**
 * Add song to active collaboration sessions
 */
const addActiveSession = (songId) => {
  activeSessions.value.add(songId.toString())
}

/**
 * Remove song from active collaboration sessions
 */
const removeActiveSession = (songId) => {
  activeSessions.value.delete(songId.toString())
}

// Listen for collaboration events from other components
window.addEventListener('collaboration-started', (event) => {
  const { songId } = event.detail
  if (songId) {
    addActiveSession(songId)
  }
})

window.addEventListener('collaboration-stopped', (event) => {
  const { songId } = event.detail
  if (songId) {
    removeActiveSession(songId)
  }
})

/**
 * Check if a collaboration is owned by the current user
 */
const isCollaborationOwner = (collaboration) => {
  return collaboration.ownerId === userStore.userId
}

/**
 * Handle deletion of a collaboration
 */
const handleDeleteCollaboration = (collaboration) => {
  const isOwner = isCollaborationOwner(collaboration)
  const sessionId = collaboration.sessionId || collaboration.id
  
  if (isOwner) {
    // Owner stops the entire collaboration
    confirmDelete({
      title: 'Stop Collaboration',
      itemName: collaboration.songTitle || 'Shared Song',
      message: 'This will end the collaboration for all participants. They will no longer be able to edit this song.',
      confirmText: 'Stop Collaboration',
      onConfirm: async () => {
        try {
          await collaborationService.stopCollaborationSession(sessionId, userStore.userId)
          
          // Remove from local active sessions
          removeActiveSession(collaboration.songId)
          
          // Remove from localStorage
          localStorage.removeItem(`collaboration_${collaboration.songId}`)
          
          // Reload collaborations to update UI
          await loadCollaborations()
          
          // Emit event for other components
          window.dispatchEvent(new CustomEvent('collaboration-stopped', {
            detail: { songId: collaboration.songId, sessionId }
          }))
          
        } catch (error) {
          collaboration.error('❌ Failed to stop collaboration:', error)
        }
      }
    })
  } else {
    // Non-owner leaves the collaboration
    confirmDelete({
      title: 'Leave Collaboration',
      itemName: collaboration.songTitle || 'Shared Song',
      message: 'You will leave this collaboration but others can continue working. You can rejoin later using the collaboration link.',
      confirmText: 'Leave',
      onConfirm: async () => {
        try {
          await collaborationService.leaveCollaborationSession(sessionId, userStore.userId)
          
          // Remove from local active sessions
          removeActiveSession(collaboration.songId)
          
          // Remove from localStorage
          localStorage.removeItem(`collaboration_${collaboration.songId}`)
          
          // Reload collaborations to update UI
          await loadCollaborations()
          
        } catch (error) {
          collaboration.error('❌ Failed to leave collaboration:', error)
        }
      }
    })
  }
}
</script>

<style scoped>
/* Modal animations */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-content {
  animation: slideIn 0.3s ease-out forwards;
}

.modal-fade-leave-active .modal-content {
  animation: slideOut 0.25s ease-in forwards;
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

@keyframes slideOut {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Gradient variables */
.from-accent {
  --tw-gradient-from: var(--accent, #0055cc);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(0, 85, 204, 0));
}

.from-accent-secondary {
  --tw-gradient-from: var(--accent-secondary, #6f5be3);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(111, 91, 227, 0));
}

.from-accent-dark {
  --tw-gradient-from: var(--accent-dark, #0044a8);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(0, 68, 168, 0));
}

.from-accent-darker {
  --tw-gradient-from: var(--accent-darker, #003c8f);
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(0, 60, 143, 0));
}

.to-accent {
  --tw-gradient-to: var(--accent, #0055cc);
}

.to-accent-secondary {
  --tw-gradient-to: var(--accent-secondary, #6f5be3);
}

.to-accent-dark {
  --tw-gradient-to: var(--accent-dark, #0044a8);
}

.to-accent-darker {
  --tw-gradient-to: var(--accent-darker, #003c8f);
}

:deep(.dark) .from-accent {
  --tw-gradient-from: var(--accent, #4180db);
}

:deep(.dark) .from-accent-secondary {
  --tw-gradient-from: var(--accent-secondary, #8471e8);
}

:deep(.dark) .to-accent {
  --tw-gradient-to: var(--accent, #4180db);
}

:deep(.dark) .to-accent-secondary {
  --tw-gradient-to: var(--accent-secondary, #8471e8);
}
</style> 