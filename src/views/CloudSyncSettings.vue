<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFileManager } from '../stores/fileManager'
import { useUserStore } from '../stores/user'
import CloudSync from '../components/sync/CloudSync.vue'
import Icon from '../components/ui/Icon.vue'

const router = useRouter()
const fileManager = useFileManager()
const userStore = useUserStore()

const goBack = () => {
  router.push('/settings')
}

const cloudSyncStatus = computed(() => {
  if (!userStore.isAuthenticated) return 'Nicht angemeldet'
  if (!fileManager.cloudSyncEnabled) return 'Nicht aktiv'
  
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'Synchronisiert...'
    case 'success': return 'Aktuell'
    case 'error': return 'Fehler'
    default: return 'Bereit'
  }
})

const cloudStatusColor = computed(() => {
  if (!userStore.isAuthenticated || !fileManager.cloudSyncEnabled) return 'bg-gray-400'
  
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'bg-blue-500'
    case 'success': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
})

const cloudStatusIcon = computed(() => {
  if (!userStore.isAuthenticated) return 'close'
  if (!fileManager.cloudSyncEnabled) return 'pause'
  
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'loading'
    case 'success': return 'checkmark'
    case 'error': return 'warning'
    default: return 'cloud'
  }
})
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
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Cloud-Synchronisation</h1>
      </div>
    </div>

    <!-- Content -->
    <div class="px-4 py-6">
      <!-- Status Card -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-center space-x-4">
          <div class="relative">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Icon :name="cloudStatusIcon" :size="24" class="text-gray-600 dark:text-gray-300" />
            </div>
            <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center" :class="cloudStatusColor">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ cloudSyncStatus }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ userStore.isAuthenticated ? 'Cloud-Sync aktiv' : 'Anmeldung erforderlich' }}
            </p>
          </div>
        </div>
      </div>

      <!-- Cloud Sync Component -->
      <div v-if="userStore.isAuthenticated" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm mb-6">
        <CloudSync />
      </div>

      <!-- Not authenticated message -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-center mb-6">
        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="info" :size="24" class="text-gray-400" />
        </div>
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">Nicht angemeldet</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Melden Sie sich an, um Ihre Songs in der Cloud zu synchronisieren
        </p>
        <button
          @click="router.push('/login')"
          class="inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
        >
          <Icon name="login" :size="16" />
          <span>Jetzt anmelden</span>
        </button>
      </div>

      <!-- Info Cards -->
      <div class="space-y-4">
        <!-- Sync Info -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div class="flex items-start space-x-3">
            <Icon name="info" :size="20" class="text-blue-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>Automatische Synchronisation:</strong> Ihre Songs werden automatisch zwischen Ihren Geräten synchronisiert, sobald Sie eine Internetverbindung haben.
            </div>
          </div>
        </div>

        <!-- Privacy Info -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
          <div class="flex items-start space-x-3">
            <Icon name="shield" :size="20" class="text-green-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-green-700 dark:text-green-300 leading-relaxed">
              <strong>Datenschutz:</strong> Ihre Songs werden verschlüsselt in Firebase gespeichert und sind nur für Sie zugänglich.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 