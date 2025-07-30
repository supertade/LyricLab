<template>
  <div class="collaboration-indicator">
    <!-- Online Users Bar -->
    <div v-if="session && session.collaborators.length > 1" 
         class="fixed top-safe right-4 z-50 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
      <div class="flex items-center space-x-1">
        <!-- Collaboration Icon -->
        <Icon name="users" :size="16" class="text-blue-500" />
        
        <!-- User Avatars -->
        <div class="flex -space-x-1">
          <div v-for="user in session.collaborators" 
               :key="user.uid"
               class="relative group">
            <!-- User Avatar -->
            <div class="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-semibold text-white"
                 :style="{ backgroundColor: user.color }">
              {{ getUserInitials(user) }}
            </div>
            
            <!-- Tooltip -->
            <div class="absolute bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <div class="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {{ user.email }}
                <div class="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div class="border-4 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- User Count -->
        <span class="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">
          {{ session.collaborators.length }}
        </span>
      </div>
    </div>

    <!-- Real-time Cursors -->
    <div v-if="showCursors" class="collaboration-cursors">
      <div v-for="user in otherUsers" 
           :key="user.uid"
           v-show="user.cursor"
           class="collaboration-cursor absolute z-40 pointer-events-none"
           :style="getCursorStyle(user)">
        <!-- Cursor Line -->
        <div class="w-0.5 h-5 animate-pulse"
             :style="{ backgroundColor: user.color }"></div>
        
        <!-- User Label -->
        <div class="absolute top-5 left-0 text-xs px-2 py-1 rounded text-white whitespace-nowrap"
             :style="{ backgroundColor: user.color }">
          {{ getUserName(user) }}
        </div>
      </div>
    </div>

    <!-- Collaboration Status -->
    <div v-if="isCollaborating" 
         class="fixed bottom-safe left-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-full shadow-lg">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        <span class="text-sm font-medium">Live Collaboration</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '../ui/Icon.vue'
import type { CollaborationSession, CollaborationUser } from '../../services/collaboration'

const props = defineProps<{
  session: CollaborationSession | null
  currentUserId: string
  showCursors?: boolean
}>()

const isCollaborating = computed(() => 
  props.session && props.session.collaborators.length > 1
)

const otherUsers = computed(() => 
  props.session?.collaborators.filter(user => user.uid !== props.currentUserId) || []
)

const getUserInitials = (user: CollaborationUser): string => {
  if (user.displayName) {
    return user.displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }
  return user.email.charAt(0).toUpperCase()
}

const getUserName = (user: CollaborationUser): string => {
  return user.displayName || user.email.split('@')[0]
}

const getCursorStyle = (user: CollaborationUser) => {
  if (!user.cursor) return { display: 'none' }
  
  // This would be calculated based on the actual cursor position
  // For now, we return a placeholder style
  return {
    top: '100px',
    left: '50px',
    color: user.color
  }
}
</script>

<style scoped>
.collaboration-cursor {
  transition: all 0.2s ease-out;
}

.collaboration-indicator {
  pointer-events: none;
}

.collaboration-indicator > * {
  pointer-events: auto;
}

/* Smooth animations for cursor movement */
@keyframes cursor-blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.collaboration-cursor .w-0.5 {
  animation: cursor-blink 1s infinite;
}
</style> 