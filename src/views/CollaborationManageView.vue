<template>
  <div class="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation Header -->
    <header class="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/30 dark:border-white/10">
      <div class="flex items-center justify-between px-4 py-3">
        <!-- Left: Back Button -->
        <div class="flex items-center">
          <button 
            @click="goBack"
            class="flex items-center justify-center w-10 h-10 rounded-full text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors mr-3"
          >
            <Icon name="chevronLeft" :size="20" />
          </button>
          
          <div>
            <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ isOwner ? 'Manage Collaboration' : 'Collaborators' }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ sharedSong?.title || 'Untitled Song' }}
            </p>
          </div>
        </div>

        <!-- Right: Member Count -->
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30">
          <Icon name="users" :size="16" class="text-blue-600 dark:text-blue-400" />
          <span class="text-sm font-medium text-blue-700 dark:text-blue-300">
            {{ collaborators.length }} member{{ collaborators.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      <div class="max-w-2xl mx-auto h-full flex flex-col">
        
        <!-- Loading State -->
        <div v-if="isLoading" class="flex-1 flex items-center justify-center">
          <div class="text-center">
            <div class="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-500 dark:text-gray-400">Loading collaboration...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="flex-1 flex items-center justify-center p-6">
          <div class="text-center">
            <div class="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="warning" :size="32" class="text-red-600 dark:text-red-400" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">{{ error }}</p>
            <Button @click="retryLoad" variant="primary">
              Try Again
            </Button>
          </div>
        </div>

        <!-- Collaborators List -->
        <div v-else class="flex-1 flex flex-col">
          
          <!-- Copy Link Section (Owner) -->
          <div v-if="isOwner" class="p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Collaboration Link
            </h2>
            <div class="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl">
              <input
                ref="linkInput"
                :value="collaborationLink"
                readonly
                class="flex-1 bg-transparent text-sm font-mono text-gray-700 dark:text-gray-300 outline-none"
              />
              <button
                @click="copyCollaborationLink"
                class="px-6 py-2 text-sm font-semibold rounded-xl transition-all"
                :class="copyStatus === 'copied' 
                  ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                  : 'text-blue-600 bg-blue-100 hover:bg-blue-200 dark:text-blue-400 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'"
              >
                {{ copyStatus === 'copied' ? 'Copied!' : 'Copy Link' }}
              </button>
            </div>
          </div>

          <!-- Members List -->
          <div class="flex-1 overflow-y-auto bg-white dark:bg-gray-800">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Members
              </h2>
              
              <div class="space-y-3">
                                 <div 
                   v-for="user in collaborators" 
                   :key="`${user.uid}-${user.lastSeen || Date.now()}`"
                  class="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div class="flex items-center space-x-4 flex-1 min-w-0">
                    <!-- User Avatar -->
                    <div 
                      class="w-14 h-14 rounded-full flex items-center justify-center text-lg font-medium text-white shadow-lg"
                      :style="{ backgroundColor: user.color }"
                    >
                      {{ getUserInitials(user) }}
                    </div>
                    
                    <!-- User Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-3 mb-1">
                        <h3 class="font-semibold text-gray-900 dark:text-white truncate text-lg">
                          {{ user.displayName || user.email.split('@')[0] }}
                        </h3>
                        
                        <!-- Owner Badge -->
                        <span 
                          v-if="user.uid === session?.ownerId"
                          class="text-xs px-3 py-1 bg-blue-500 text-white rounded-full font-medium"
                        >
                          Owner
                        </span>
                        
                        <!-- You Badge -->
                        <span 
                          v-else-if="user.uid === userStore.userId"
                          class="text-xs px-3 py-1 bg-gray-500 text-white rounded-full font-medium"
                        >
                          You
                        </span>
                      </div>
                      
                      <p class="text-gray-500 dark:text-gray-400 truncate">
                        {{ user.email }}
                      </p>
                      
                                             <p v-if="user.lastSeen" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                         Last seen {{ formatJoinTime(user.lastSeen) }}
                       </p>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex items-center ml-4">
                    <!-- Remove User (Owner only) -->
                    <button
                      v-if="isOwner && user.uid !== userStore.userId && user.uid !== session?.ownerId"
                      @click="removeCollaborator(user.uid)"
                      class="w-10 h-10 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center"
                      title="Remove from collaboration"
                    >
                      <Icon name="trash" :size="18" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Leave Collaboration (Non-owner) -->
          <div v-if="!isOwner" class="p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="leaveCollaboration"
              class="w-full py-4 px-6 text-red-600 hover:text-white font-semibold bg-red-50 hover:bg-red-500 dark:bg-red-900/20 dark:hover:bg-red-600 rounded-2xl transition-all duration-200"
            >
              Leave Collaboration
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { collaborationService } from '../services/collaboration'
import { getDocs, query, collection, where } from 'firebase/firestore'
import { getFirestore } from '../services/firebase'
import Button from '../components/ui/Button.vue'
import Icon from '../components/ui/Icon.vue'
import type { CollaborationSession, CollaborationUser } from '../services/collaboration'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// State
const isLoading = ref(true)
const error = ref('')
const session = ref<CollaborationSession | null>(null)
const sharedSong = ref<any>(null)
const copyStatus = ref<'idle' | 'copied'>('idle')
const linkInput = ref<HTMLInputElement>()
const unsubscribeSession = ref<(() => void) | null>(null)

// Computed
const collaborators = computed(() => session.value?.collaborators || [])
const isOwner = computed(() => session.value?.ownerId === userStore.userId)
const collaborationLink = computed(() => {
  const sessionId = route.params.sessionId as string
  return `${window.location.origin}/collaborate/${sessionId}`
})

// Methods
const getUserInitials = (user: CollaborationUser): string => {
  if (user.displayName) {
    return user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }
  return user.email.charAt(0).toUpperCase()
}

const formatJoinTime = (timestamp: any): string => {
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return date.toLocaleDateString()
  } catch {
    return ''
  }
}

const loadCollaborationData = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    const sessionId = route.params.sessionId as string
    
    // Listen to session changes to get current data
    unsubscribeSession.value = collaborationService.listenToSessionChanges(sessionId, async (sessionData) => {
      session.value = sessionData
      
      // Load shared song directly from shared_songs collection
      try {
        const firestore = await getFirestore()
        const songDoc = await getDocs(query(collection(firestore, 'shared_songs'), where('__name__', '==', sessionId)))
        
        if (!songDoc.empty) {
          const songData = songDoc.docs[0].data()
          
          sharedSong.value = {
            id: songData.id,
            title: songData.title || 'Untitled Song',
            sections: songData.sections || [],
            bpm: songData.bpm || '',
            key: songData.key || '',
            createdAt: songData.createdAt,
            updatedAt: songData.updatedAt || songData.lastModified
          }
          
          collaboration('✅ Loaded shared song for management:', sharedSong.value.title)
        }
      } catch (err) {
        collaboration('Failed to load shared song:', err)
      }
      
      isLoading.value = false
    })
    
  } catch (err) {
    collaboration('Failed to load collaboration data:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load collaboration'
    isLoading.value = false
  }
}

const retryLoad = () => {
  loadCollaborationData()
}

const goBack = () => {
  const sessionId = route.params.sessionId as string
  router.push(`/collaborate/${sessionId}`)
}

const removeCollaborator = async (userId: string) => {
  try {
    const sessionId = route.params.sessionId as string
    await collaborationService.leaveCollaborationSession(sessionId, userId)
    collaboration(`✅ Removed user ${userId} from collaboration`,11847)
  } catch (error) {
    collaboration('❌ Failed to remove collaborator:', error)
    alert('Failed to remove collaborator. Please try again.')
  }
}

const copyCollaborationLink = async () => {
  try {
    await navigator.clipboard.writeText(collaborationLink.value)
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

const leaveCollaboration = async () => {
  try {
    const sessionId = route.params.sessionId as string
    if (userStore.userId) {
      await collaborationService.leaveCollaborationSession(sessionId, userStore.userId)
      
      // Navigate back to home and remove collaboration from localStorage
      const songId = session.value?.songId
      if (songId) {
        localStorage.removeItem(`collaboration_${songId}`)
        
        // Notify other components about collaboration stop
        window.dispatchEvent(new CustomEvent('collaboration-stopped', {
          detail: { songId: songId }
        }))
      }
      
      router.push('/')
      collaboration('✅ Left collaboration successfully',13204)
    }
  } catch (error) {
    collaboration('❌ Failed to leave collaboration:', error)
    alert('Failed to leave collaboration. Please try again.')
  }
}

onMounted(() => {
  loadCollaborationData()
})

onUnmounted(() => {
  if (unsubscribeSession.value) {
    unsubscribeSession.value()
  }
})
</script> 