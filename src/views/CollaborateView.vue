<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Clean Navigation Header -->
    <header class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/30 dark:border-white/10">
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Left: Back Button + Song Info -->
        <div class="flex items-center min-w-0 flex-1">
          <button 
            @click="leaveSession"
            class="flex items-center justify-center w-10 h-10 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors mr-3"
          >
            <Icon name="chevronLeft" :size="20" />
          </button>
          
          <div v-if="sharedSong" class="min-w-0 flex-1">
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {{ sharedSong.title || 'Untitled Song' }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Collaborative editing
            </p>
          </div>
        </div>

        <!-- Right: Collaboration Status -->
        <div class="flex items-center gap-3">
          <!-- Online Status -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/30">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-green-700 dark:text-green-300">
              {{ collaborators.length }} online
            </span>
          </div>
          
          <!-- User Avatars - Clickable -->
          <div 
            class="flex items-center -space-x-2 cursor-pointer hover:scale-105 transition-transform"
            @click="openManagePage"
            title="Manage collaborators"
          >
            <div 
              v-for="user in collaborators.slice(0, 3)" 
              :key="user.uid" 
              class="relative"
            >
              <div 
                class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                :style="{ backgroundColor: user.color }"
              >
                {{ getUserInitials(user) }}
              </div>
            </div>
            
            <div 
              v-if="collaborators.length > 3" 
              class="w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm"
            >
              +{{ collaborators.length - 3 }}
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-hidden">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-1">
            Connecting...
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Loading collaborative session
          </p>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="min-h-screen flex items-center justify-center p-4">
        <div class="text-center max-w-md">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="exclamation-triangle" class="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {{ error.includes('E-Mail-Bestätigung') ? 'E-Mail-Bestätigung erforderlich' : 'Fehler beim Beitreten' }}
          </h2>
          
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            {{ error }}
          </p>
          
          <div class="space-y-3">
            <!-- If email verification error, show different buttons -->
            <template v-if="error.includes('E-Mail-Bestätigung')">
              <Button
                @click="$router.push('/settings/account')"
                variant="primary"
                size="md"
              >
                Zur E-Mail-Bestätigung
              </Button>
              
              <Button
                @click="retryJoin"
                variant="secondary"
                size="md"
              >
                Erneut versuchen
              </Button>
            </template>
            
            <!-- For other errors -->
            <template v-else>
              <Button
                @click="retryJoin"
                variant="primary"
                size="md"
              >
                Erneut versuchen
              </Button>
            </template>
            
            <Button
              @click="goToHome"
              variant="ghost"
              size="md"
            >
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>

      <!-- Collaborative Song Editor -->
      <div v-else-if="sharedSong" class="h-full">
        <CollaborativeSongEditor 
          :song="sharedSong"
          :session="session"
          :current-user-id="userStore.userId || ''"
          @song-updated="handleSongUpdate"
        />
      </div>
    </main>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { collaborationService } from '../services/collaboration'
import { cloudStorage } from '../services/cloudStorage'
import { getDocs, query, collection, where } from 'firebase/firestore'
import { getFirestore } from '../services/firebase'
import Button from '../components/ui/Button.vue'
import Icon from '../components/ui/Icon.vue'
import CollaborativeSongEditor from '../components/lyrics/CollaborativeSongEditor.vue'
import type { CollaborationSession, CollaborationUser } from '../services/collaboration'
import { collaboration, sync, storage } from '../utils/logger'
import firebaseAuth from '../services/firebase'
import { userColorService } from '../services/userColorService'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// State
const isLoading = ref(true)
const error = ref('')
const session = ref<CollaborationSession | null>(null)
const sharedSong = ref<any>(null)
const unsubscribeSession = ref<(() => void) | null>(null)
const unsubscribeSong = ref<(() => void) | null>(null)
const isDestroyed = ref(false)
// Computed
const collaborators = computed(() => session.value?.collaborators || [])

// Methods
const getUserInitials = (user: CollaborationUser): string => {
  if (user.displayName) {
    return user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }
  return user.email.charAt(0).toUpperCase()
}

const loadSharedSong = async (sessionId: string) => {
  try {
    collaboration('Loading shared song for session:', sessionId)
    
    // Load song directly from shared_songs collection (accessible to all collaborators)
    const firestore = await getFirestore()
    const songDoc = await getDocs(query(collection(firestore, 'shared_songs'), where('__name__', '==', sessionId)))
    
    if (songDoc.empty) {
      throw new Error('Shared song not found')
    }
    
    const songData = songDoc.docs[0].data()
    
    // Convert to local format (song is already in the right format in shared_songs)
    sharedSong.value = {
      id: songData.id,
      title: songData.title || 'Untitled Song',
      sections: songData.sections || [],
      bpm: songData.bpm || '',
      key: songData.key || '',
      createdAt: songData.createdAt,
      updatedAt: songData.updatedAt || songData.lastModified
    }
    
    storage('✅ Loaded shared song:', sharedSong.value.title)
  } catch (err) {
    storage('Failed to load shared song:', err)
    throw new Error('Failed to load the shared song')
  }
}

const joinSession = async () => {
  try {
    // Reset destroyed flag if rejoining
    isDestroyed.value = false
    isLoading.value = true
    error.value = ''
    
    const sessionId = route.params.sessionId as string
    
    if (!userStore.userId || !userStore.userEmail) {
      throw new Error('You must be logged in to join a collaboration session')
    }

    // Check if email is verified before joining collaboration
    const currentUser = firebaseAuth.getCurrentUser()
    if (!currentUser || !currentUser.emailVerified) {
      throw new Error('E-Mail-Bestätigung erforderlich. Bitte bestätigen Sie Ihre E-Mail-Adresse, um an Kollaborationen teilzunehmen.')
    }

    // Join the collaboration session
    await collaborationService.joinCollaborationSession(
      sessionId, 
      userStore.userId, 
      userStore.userEmail
    )

    // Load session data by listening to it
    let sessionLoaded = false
    
    const loadSessionPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Session load timeout')), 10000)
      
      unsubscribeSession.value = collaborationService.listenToSessionChanges(sessionId, async (sessionData) => {
        try {
          // Check if component is still valid
          if (isDestroyed.value) {
            collaboration('🚫 Component destroyed, ignoring session update')
            return
          }

          if (!sessionLoaded) {
            sessionLoaded = true
            clearTimeout(timeout)
            
            try {
              session.value = sessionData
              
              // Initialize user color service with session data
              if (sessionData.collaborators) {
                userColorService.initializeFromSession(sessionId, sessionData.collaborators)
                collaboration('🎨 Initialized user colors for session:', sessionId)
              }
              
              // Load the shared song using session ID
              await loadSharedSong(sessionId)
              
              resolve()
            } catch (err) {
              reject(err)
            }
          } else {
            // Update session after initial load
            session.value = sessionData
            
            // Update user color service with any new collaborators
            if (sessionData.collaborators) {
              userColorService.initializeFromSession(sessionId, sessionData.collaborators)
            }
          }
        } catch (err) {
          collaboration('❌ Error in session listener:', err)
          if (!sessionLoaded) {
            reject(err)
          }
        }
      })
    })
    
    await loadSessionPromise

    // Listen to session changes
    unsubscribeSession.value = collaborationService.listenToSessionChanges(sessionId, (updatedSession) => {
      try {
        // Check if component is still valid
        if (isDestroyed.value) {
          collaboration('🚫 Component destroyed, ignoring session update')
          return
        }
        
        session.value = updatedSession
      } catch (err) {
        collaboration('❌ Error in session update listener:', err)
      }
    })

    // Listen to real-time song changes
    unsubscribeSong.value = collaborationService.listenToSongChanges(sessionId, (updatedSong) => {
      try {
        // Check if component is still valid
        if (isDestroyed.value) {
          collaboration('🚫 Component destroyed, ignoring song update')
          return
        }

        sync('📥 Real-time song update received from Firebase:', {
          title: updatedSong.title,
          sectionsCount: updatedSong.sections?.length || 0,
          lastModifiedBy: (updatedSong as any).lastModifiedBy,
          currentUserId: userStore.userId
        })
        
        // Update the shared song with new data
        const newSongData = {
          id: updatedSong.id,
          title: updatedSong.title || 'Untitled Song',
          sections: updatedSong.sections || [],
          bpm: updatedSong.bpm || '',
          key: updatedSong.key || '',
          createdAt: updatedSong.createdAt,
          updatedAt: updatedSong.updatedAt
        }
        
        sharedSong.value = newSongData
        sync('✅ Local sharedSong updated with Firebase data:', newSongData.title)
      } catch (err) {
        collaboration('❌ Error in song listener:', err)
      }
    })

    collaboration('✅ Successfully joined collaboration session with real-time listeners')
  } catch (err) {
    collaboration('❌ Failed to join collaboration session:', err)
    
    // Provide better error messages
    let errorMessage = 'Failed to join collaboration session'
    if (err instanceof Error) {
      if (err.message.includes('permission-denied') || err.message.includes('PERMISSION_DENIED')) {
        errorMessage = 'E-Mail-Bestätigung erforderlich. Bitte bestätigen Sie Ihre E-Mail-Adresse, um an Kollaborationen teilzunehmen.'
      } else if (err.message.includes('E-Mail-Bestätigung erforderlich')) {
        errorMessage = err.message
      } else if (err.message.includes('not found')) {
        errorMessage = 'Kollaboration nicht gefunden. Der Link ist möglicherweise abgelaufen oder ungültig.'
      } else {
        errorMessage = err.message || errorMessage
      }
    }
    
    error.value = errorMessage
  } finally {
    isLoading.value = false
  }
}

const handleSongUpdate = async (updatedSong: any) => {
  try {
    // Check if component is still valid
    if (isDestroyed.value) {
      collaboration('🚫 Component destroyed, ignoring song update')
      return
    }

    const sessionId = route.params.sessionId as string
    
    sync('📤 Sending local song update to Firebase:', updatedSong.title)
    
    // Immediate local update for responsive UI (optimistic update)
    if (!isDestroyed.value) {
      sharedSong.value = updatedSong
    }
    
    // Update the song in the collaboration session (background)
    await collaborationService.updateSong(sessionId, updatedSong, userStore.userId || '')
    
    // Also save to cloud storage if user is the owner
    if (session.value?.ownerId === userStore.userId) {
      await cloudStorage.saveSong(updatedSong, userStore.userId || '')
    }
    
    sync('✅ Song update sent to Firebase successfully')
  } catch (err) {
    sync('❌ Failed to sync song update:', err)
    // If Firebase update fails, the listener will correct any inconsistencies
  }
}

const retryJoin = () => {
  joinSession()
}

const goToHome = () => {
  router.push('/')
}

const leaveSession = () => {
  // Just navigate back - don't stop the collaboration
  // The collaboration stays active until explicitly stopped via "Stop Collaboration" button
  router.push('/')
}

const openManagePage = () => {
  const sessionId = route.params.sessionId as string
  router.push(`/collaborate/${sessionId}/manage`)
}

// Cleanup on unmount
onUnmounted(() => {
  try {
    // Mark component as destroyed to prevent further updates
    isDestroyed.value = true
    
    // Clean up Firebase listeners
    if (unsubscribeSession.value) {
      unsubscribeSession.value()
      unsubscribeSession.value = null
    }
    if (unsubscribeSong.value) {
      unsubscribeSong.value()
      unsubscribeSong.value = null
    }
    
    // Clear refs to help garbage collection
    session.value = null
    sharedSong.value = null
    
    collaboration('🧹 Cleaned up collaboration listeners and marked component as destroyed')
  } catch (err) {
    collaboration('❌ Error during cleanup:', err)
  }
})

// Initialize
onMounted(() => {
  joinSession()
})
</script> 