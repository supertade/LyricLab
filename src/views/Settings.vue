<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFileManager } from '../stores/fileManager'
import { useUserStore } from '../stores/user'
import Button from '../components/ui/Button.vue'
import SettingRow from '../components/ui/SettingRow.vue'
import Icon from '../components/ui/Icon.vue'

const router = useRouter()
const fileManager = useFileManager()
const userStore = useUserStore()

// Props
const props = defineProps({
  isDarkMode: {
    type: Boolean,
    default: false
  }
})

// Emit for dark mode toggle
const emit = defineEmits(['toggle-dark-mode'])

// Computed
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

// Methods
const toggleDarkMode = () => {
  emit('toggle-dark-mode')
}

const goBack = () => {
  router.push('/')
}

const goToLogin = () => {
  router.push('/login')
}

const goToAccount = () => {
  router.push('/settings/account')
}

const goToCloudSync = () => {
  router.push('/settings/cloud-sync')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-safe">
    <!-- Clean, minimal header -->
    <div class="pt-safe px-4 py-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div class="flex items-center space-x-3">
        <button 
          @click="goBack" 
          class="p-2 -ml-2 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
          aria-label="Back"
        >
          <Icon name="chevronLeft" :size="20" />
        </button>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>
    </div>

    <!-- Settings List - iOS style -->
    <div class="px-4 py-6 space-y-8">
      
      <!-- Account Section -->
      <div class="space-y-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white px-1">Account</h2>
        
        <!-- User Profile Card -->
        <div v-if="userStore.isAuthenticated" class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">          
          <!-- Account Actions -->
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            <SettingRow 
              icon="settings" 
              :title="userStore.userEmail || 'Account'" 
              subtitle="E-Mail und Passwort ändern"
              @click="goToAccount"
            />
            
            <SettingRow 
              icon="cloud" 
              title="Cloud-Synchronisation" 
              :subtitle="cloudSyncStatus"
              @click="goToCloudSync"
              :chevron="false"
            >
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 rounded-full" :class="cloudStatusColor"></div>
                <Icon name="chevronRight" :size="16" class="text-gray-400" />
              </div>
            </SettingRow>
          </div>
        </div>
        
        <!-- Not authenticated -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div class="divide-y divide-gray-100 dark:divide-gray-700">
            <SettingRow 
              icon="cloud" 
              title="Cloud-Synchronisation" 
              subtitle="Nicht angemeldet"
              @click="goToCloudSync"
              :chevron="false"
            >
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                <Icon name="chevronRight" :size="16" class="text-gray-400" />
              </div>
            </SettingRow>
          </div>
          
          <div class="p-6 text-center bg-gray-50 dark:bg-gray-700/50">
            <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon name="info" :size="24" class="text-gray-400" />
            </div>
            <h3 class="font-medium text-gray-900 dark:text-white mb-2">Nicht angemeldet</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Melden Sie sich an für erweiterte Features</p>
            <Button @click="goToLogin" variant="primary" size="md">Anmelden</Button>
          </div>
        </div>
      </div>

      <!-- Preferences Section -->
      <div class="space-y-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white px-1">Preferences</h2>
        
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <!-- Dark Mode Toggle -->
          <SettingRow 
            :icon="isDarkMode ? 'moon' : 'sun'" 
            title="Dark Mode" 
            subtitle="Hell oder dunkel"
            :chevron="false"
            @click="toggleDarkMode"
          >
            <div 
              class="relative w-12 h-6 rounded-full transition-all duration-200 border-2"
              :class="isDarkMode 
                ? 'bg-blue-500 border-blue-500' 
                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600'"
            >
              <div 
                class="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 flex items-center justify-center"
                :class="[
                  isDarkMode 
                    ? 'translate-x-6 bg-white' 
                    : 'translate-x-0.5 bg-gray-400 dark:bg-gray-300',
                ]"
              >
                <Icon 
                  :name="isDarkMode ? 'moon' : 'sun'" 
                  :size="10" 
                  :class="isDarkMode ? 'text-blue-500' : 'text-white'"
                />
              </div>
            </div>
          </SettingRow>
        </div>
      </div>

      <!-- Data Section -->
      <div class="space-y-3">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white px-1">Data</h2>
        
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <SettingRow 
            icon="song" 
            title="Songs neu laden" 
            subtitle="Lokale Songs aktualisieren"
            @click="fileManager.loadSongs()"
          />
        </div>
        
        <!-- Info Card -->
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div class="flex items-start space-x-3">
            <Icon name="info" :size="20" class="text-blue-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              <strong>Automatische Speicherung:</strong> Ihre Songs werden lokal gespeichert. 
              Mit einem Account werden sie zusätzlich in der Cloud synchronisiert.
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/**
 * Animation for section entrance
 */
.animate-section {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { 
    opacity: 0.5; 
  }
  to { 
    opacity: 1; 
  }
}

/* Stagger the animations */
.first-section {
  animation-delay: 0s;
}
.second-section {
  animation-delay: 0.05s;
}
.third-section {
  animation-delay: 0.1s;
}
.fourth-section {
  animation-delay: 0.15s;
}
</style> 