<template>
  <div class="user-profile">
    <!-- User is authenticated -->
    <div v-if="userStore.isAuthenticated" class="space-y-4">
      <!-- User Info Card -->
      <div class="card p-6">
        <div class="flex items-center space-x-4">
          <!-- Avatar placeholder -->
          <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-white font-semibold text-lg">
              {{ userInitials }}
            </span>
          </div>
          
          <!-- User Info -->
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ userStore.currentUser?.displayName || 'Benutzer' }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ userStore.userEmail }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-500">
              ID: {{ userStore.userId?.slice(0, 8) }}...
            </p>
          </div>
          
          <!-- Online Status -->
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full"></div>
            <span class="text-xs text-green-600 dark:text-green-400">Online</span>
          </div>
        </div>
      </div>
      
      <!-- Account Actions -->
      <div class="space-y-3">
        <Button
          @click="showAccountEditor = !showAccountEditor"
          variant="secondary"
          size="lg"
          full-width
          :disabled="userStore.isLoading"
          class="justify-center"
        >
          <template #icon-left>
            <Icon name="settings" class="w-4 h-4" />
          </template>
          {{ showAccountEditor ? 'Bearbeitung schließen' : 'Account bearbeiten' }}
        </Button>
        
        <Button
          @click="handleLogout"
          variant="danger"
          size="lg"
          full-width
          :disabled="userStore.isLoading"
          class="justify-center"
        >
          <template v-if="userStore.isLoading" #icon-left>
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </template>
          {{ userStore.isLoading ? 'Abmeldung...' : 'Abmelden' }}
        </Button>
      </div>
      
      <!-- Account Editor -->
      <div v-if="showAccountEditor">
        <AccountEditor />
      </div>
    </div>
    
    <!-- User is not authenticated -->
    <div v-else class="text-center space-y-4">
      <div class="card p-8">
        <div class="space-y-4">
          <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <Icon name="info" class="w-8 h-8 text-gray-400" />
          </div>
          
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
              Nicht angemeldet
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Melden Sie sich an, um Ihre Songs in der Cloud zu synchronisieren
            </p>
          </div>
          
          <Button
            @click="goToLogin"
            variant="primary"
            size="lg"
            full-width
          >
            <template #icon-left>
              <Icon name="info" class="w-4 h-4" />
            </template>
            Anmelden
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import AccountEditor from './AccountEditor.vue'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const router = useRouter()
const userStore = useUserStore()
const showAccountEditor = ref(false)

// Computed
const userInitials = computed(() => {
  const email = userStore.userEmail
  if (!email) return '?'
  
  const parts = email.split('@')[0]
  return parts.charAt(0).toUpperCase()
})

// Methods
const handleLogout = async () => {
  try {
    await userStore.logout()
    debug('✅ Erfolgreich abgemeldet',4116)
  } catch (error) {
    error('❌ Abmeldung fehlgeschlagen:', error)
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.card {
  @apply bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-sm 
         border border-gray-200/50 dark:border-white/5 overflow-hidden;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style> 