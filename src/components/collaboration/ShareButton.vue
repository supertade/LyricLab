<template>
  <!-- Subtle Share Button -->
  <button
    v-if="!isSharing"
    @click="openCollaborationModal"
    :disabled="!song || isLoading"
    class="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Share & Collaborate"
  >
    <Icon name="users" :size="20" />
  </button>

  <!-- Active Collaboration Indicator -->
  <div v-else class="relative">
    <button
      @click="openCollaborationModal"
      class="flex items-center justify-center w-10 h-10 rounded-full text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30 transition-all duration-200"
      title="Manage Collaboration"
    >
      <Icon name="users" :size="20" />
    </button>
    
    <!-- Active indicator dot -->
    <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></div>
  </div>

  <!-- Apple-Style Modal -->
  <div v-if="showModal" class="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
      @click="closeModal"
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
              {{ song?.title || 'Untitled Song' }}
            </p>
          </div>
        </div>
        
        <button
          @click="closeModal"
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
          
          <Button
            @click="handleShare"
            variant="primary"
            size="lg"
            full-width
            :disabled="isLoading"
          >
            <template #icon-left>
              <div v-if="isLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <Icon v-else name="users" :size="18" />
            </template>
            {{ isLoading ? 'Creating...' : 'Create Collaboration' }}
          </Button>
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
            <Button
              @click="shareViaWhatsApp"
              variant="outline"
              size="sm"
            >
              <template #icon-left>
                <Icon name="share" :size="16" />
              </template>
              WhatsApp
            </Button>
            
            <Button
              @click="shareViaEmail"
              variant="outline"
              size="sm"
            >
              <template #icon-left>
                <Icon name="mail" :size="16" />
              </template>
              E-Mail
            </Button>
          </div>

          <!-- Stop Collaboration -->
          <Button
            @click="stopSharing"
            variant="outline"
            size="sm"
            full-width
            class="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <template #icon-left>
              <Icon name="close" :size="16" />
            </template>
            Stop Collaboration
          </Button>
        </div>
      </div>

      <!-- Handle for mobile -->
      <div class="flex justify-center pb-2 sm:hidden">
        <div class="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../../stores/user'
import { collaborationService } from '../../services/collaboration'
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import type { Song } from '../../stores/fileManager'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const props = defineProps<{
  song: Song | null
}>()

const emit = defineEmits<{
  'collaboration-started': [sessionId: string, shareLink: string]
  'collaboration-stopped': []
}>()

const userStore = useUserStore()
const linkInput = ref<HTMLInputElement>()

// State
const isSharing = ref(false)
const isLoading = ref(false)
const shareLink = ref('')
const currentSessionId = ref('')
const copyStatus = ref<'idle' | 'copied'>('idle')
const showModal = ref(false)

// Methods
const openCollaborationModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const handleShare = async () => {
  if (!props.song || !userStore.userId || !userStore.userEmail) return

  try {
    isLoading.value = true
    const link = await collaborationService.createCollaborationSession(
      props.song, 
      userStore.userId, 
      userStore.userEmail
    )
    
    shareLink.value = link
    isSharing.value = true
    currentSessionId.value = link.split('/').pop() || ''
    
    emit('collaboration-started', currentSessionId.value, link)
  } catch (error) {
    collaboration('Failed to create collaboration session:', error)
  } finally {
    isLoading.value = false
  }
}

const stopSharing = async () => {
  if (currentSessionId.value && userStore.userId) {
    try {
      await collaborationService.leaveCollaborationSession(currentSessionId.value, userStore.userId)
    } catch (error) {
      collaboration('Failed to leave collaboration session:', error)
    }
  }
  
  isSharing.value = false
  shareLink.value = ''
  currentSessionId.value = ''
  emit('collaboration-stopped')
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    copyStatus.value = 'copied'
    
    // Reset status after 2 seconds
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

const shareViaWhatsApp = () => {
  const message = `🎵 Let's collaborate on "${props.song?.title}" in LyricLab!\n\nJoin here: ${shareLink.value}`
  const url = `https://wa.me/?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
}

const shareViaEmail = () => {
  const subject = `Collaborate on "${props.song?.title}" - LyricLab`
  const body = `Hi!\n\nI'd like to invite you to collaborate with me on the song "${props.song?.title}" using LyricLab.\n\nClick this link to join the real-time collaboration:\n${shareLink.value}\n\nYou can edit lyrics, add sections, and record audio ideas together in real-time!\n\nBest regards`
  
  const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.location.href = mailtoUrl
}


</script> 