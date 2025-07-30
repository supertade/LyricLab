<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import AccountEditor from '../components/auth/AccountEditor.vue'
import Icon from '../components/ui/Icon.vue'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const router = useRouter()
const userStore = useUserStore()

const goBack = () => {
  router.push('/settings')
}

const handleLogout = async () => {
  try {
    await userStore.logout()
    router.push('/settings')
  } catch (error) {
    error('Logout failed:', error)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe">
    <!-- Header -->
    <div class="pt-safe px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div class="flex items-center space-x-3">
        <button 
          @click="goBack" 
          class="p-2 -ml-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          aria-label="Back to Settings"
        >
          <Icon name="chevronLeft" :size="20" />
        </button>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Account</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 py-6">
      <!-- User Info -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <span class="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {{ userStore.userEmail?.charAt(0).toUpperCase() || '?' }}
            </span>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ userStore.userEmail || 'Unbekannter Benutzer' }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Ihr Account</p>
          </div>
        </div>
      </div>

      <!-- Account Editor -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
        <AccountEditor />
      </div>

      <!-- Logout Button -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <button
          @click="handleLogout"
          :disabled="userStore.isLoading"
          class="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg transition-colors font-medium"
        >
          <Icon name="close" :size="20" />
          <span>{{ userStore.isLoading ? 'Wird abgemeldet...' : 'Abmelden' }}</span>
        </button>
      </div>

      <!-- Info Card -->
      <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mt-6">
        <div class="flex items-start space-x-3">
          <Icon name="info" :size="20" class="text-blue-500 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            <strong>Account-Sicherheit:</strong> Verwenden Sie ein starkes Passwort und halten Sie Ihre E-Mail-Adresse aktuell für die beste Sicherheit.
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 