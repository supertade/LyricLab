<template>
  <div class="cloud-sync-panel">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Cloud-Synchronisation
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Ihre Songs automatisch in der Cloud speichern
        </p>
      </div>
      
      <!-- Cloud Status Indicator -->
      <div class="flex items-center space-x-2">
        <div :class="[
          'w-3 h-3 rounded-full',
          cloudStatusColor
        ]"></div>
        <span class="text-sm font-medium" :class="cloudStatusTextColor">
          {{ cloudStatusText }}
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="space-y-4">
      <!-- Authentication Required -->
      <div v-if="!userStore.isAuthenticated" class="card p-6 text-center">
        <div class="space-y-4">
          <Icon name="cloud" class="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              Anmeldung erforderlich
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Melden Sie sich an, um Ihre Songs in der Cloud zu synchronisieren
            </p>
            <Button @click="goToLogin" variant="primary" size="md">
              <template #icon-left>
                <Icon name="info" class="w-4 h-4" />
              </template>
              Jetzt anmelden
            </Button>
          </div>
        </div>
      </div>

      <!-- Email Verification Required -->
      <div v-else-if="userStore.isAuthenticated && !isEmailVerified" class="card p-6 text-center">
        <div class="space-y-4">
          <Icon name="mail" class="w-12 h-12 text-amber-500 mx-auto" />
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white mb-2">
              E-Mail-Bestätigung erforderlich
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Bitte bestätigen Sie Ihre E-Mail-Adresse, um Cloud-Synchronisation zu nutzen.
              <br>Überprüfen Sie auch Ihren Spam-Ordner.
            </p>
            <p class="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
              📧 {{ userStore.userEmail }}
            </p>
          </div>
        </div>
      </div>

      <!-- Authenticated User Panel -->
      <div v-else class="space-y-4">
        <!-- Sync Status Card -->
        <div class="card p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Songs Count -->
            <div class="text-center">
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {{ fileManager.cloudSongsCount }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Songs in Cloud
              </div>
            </div>
            
            <!-- Last Sync -->
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                {{ lastSyncDisplay }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Letzte Sync
              </div>
            </div>
            
            <!-- Sync Status -->
            <div class="text-center">
              <div class="text-2xl font-bold" :class="syncStatusColor">
                {{ syncStatusText }}
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400">
                Status
              </div>
            </div>
          </div>
        </div>

        <!-- Sync Actions -->
        <div class="space-y-3">
          <!-- Manual Sync Button -->
          <Button
            @click="handleManualSync"
            variant="primary"
            size="lg"
            full-width
            :disabled="fileManager.cloudSyncStatus === 'syncing'"
          >
            <template v-if="fileManager.cloudSyncStatus === 'syncing'" #icon-left>
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </template>
            <template v-else #icon-left>
              <Icon name="cloud" class="w-4 h-4" />
            </template>
            {{ fileManager.cloudSyncStatus === 'syncing' ? 'Synchronisierung läuft...' : 'Jetzt synchronisieren' }}
          </Button>

          <!-- Migration Button (for users with old song structure) -->
          <Button
            @click="handleMigration"
            variant="secondary"
            size="lg"
            full-width
            :disabled="fileManager.cloudSyncStatus === 'syncing'"
            v-if="showMigrationButton"
          >
            <template #icon-left>
              <Icon name="cloud" class="w-4 h-4" />
            </template>
            Songs zu neuer Struktur migrieren
          </Button>

          <!-- Load from Cloud Button -->
          <Button
            @click="handleLoadFromCloud"
            variant="secondary"
            size="lg"
            full-width
            :disabled="fileManager.cloudSyncStatus === 'syncing'"
          >
            <template #icon-left>
              <Icon name="cloud" class="w-4 h-4" />
            </template>
            Von Cloud laden
          </Button>

          <!-- Diagnostics Button -->
          <Button
            @click="runDiagnostics"
            variant="ghost"
            size="lg"
            full-width
            :disabled="isDiagnosisRunning"
          >
            <template v-if="isDiagnosisRunning" #icon-left>
              <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            </template>
            <template v-else #icon-left>
              <Icon name="checkmark" class="w-4 h-4" />
            </template>
            {{ isDiagnosisRunning ? 'Diagnosing...' : 'Problem diagnostizieren' }}
          </Button>
        </div>

        <!-- Diagnostics Results -->
        <div v-if="diagnosticsResults" class="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h4 class="font-medium text-blue-800 dark:text-blue-200 mb-3">
            🔍 Diagnose-Ergebnisse
          </h4>
          <div class="space-y-2 text-sm">
            <div v-for="(result, index) in diagnosticsResults" :key="index" class="flex items-start space-x-2">
              <span v-if="result.success" class="text-green-600 dark:text-green-400">✅</span>
              <span v-else class="text-red-600 dark:text-red-400">❌</span>
              <div class="flex-1">
                <div class="font-medium">{{ result.test }}</div>
                <div v-if="result.details" class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {{ result.details }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Quick Fixes -->
          <div v-if="diagnosticsResults.some(r => !r.success)" class="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700">
            <h5 class="font-medium text-blue-800 dark:text-blue-200 mb-2">💡 Lösungsvorschläge:</h5>
            <ul class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li v-if="diagnosticsResults.find(r => r.test.includes('Ad-Blocker'))?.success === false">
                • Ad-Blocker für diese Seite deaktivieren oder Domain zur Whitelist hinzufügen
              </li>
              <li v-if="diagnosticsResults.find(r => r.test.includes('Internet'))?.success === false">
                • WLAN/Mobile Daten überprüfen und ggf. wechseln
              </li>
              <li v-if="diagnosticsResults.find(r => r.test.includes('Firebase'))?.success === false">
                • App neu starten oder Cache leeren
              </li>
              <li>• VPN/Proxy deaktivieren</li>
              <li>• Andere Browser/App-Version testen</li>
            </ul>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="fileManager.cloudSyncError" class="card p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div class="flex items-start space-x-3">
            <Icon name="exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h4 class="font-medium text-red-800 dark:text-red-200 mb-1">
                Synchronisierungsfehler
              </h4>
              <p class="text-sm text-red-700 dark:text-red-300">
                {{ fileManager.cloudSyncError }}
              </p>
              <Button 
                @click="fileManager.resetCloudSyncStatus" 
                variant="text" 
                size="sm" 
                class="mt-2 text-red-600 dark:text-red-400"
              >
                Fehler verwerfen
              </Button>
            </div>
          </div>
        </div>

        <!-- Migration Info Panel (only show when migration button is visible) -->
        <div v-if="showMigrationButton" class="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div class="flex items-start space-x-3">
            <Icon name="exclamation-triangle" class="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-orange-700 dark:text-orange-300">
              <p class="font-medium mb-1">Migration erforderlich</p>
              <p>
                Ihre lokalen Songs verwenden noch die alte Struktur. Klicken Sie auf "Songs zu neuer Struktur migrieren", 
                um sie in das neue, sicherere Cloud-System zu übertragen.
              </p>
            </div>
          </div>
        </div>

        <!-- Info Panel -->
        <div class="card p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div class="flex items-start space-x-3">
            <Icon name="info" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-blue-700 dark:text-blue-300">
              <p class="font-medium mb-1">Automatische Synchronisation</p>
              <p>
                Ihre Songs werden automatisch in der Cloud gespeichert, wenn Sie angemeldet sind. 
                So haben Sie von jedem Gerät Zugriff auf Ihre Texte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import { useFileManager } from '../../stores/fileManager'
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import { sync } from '../../utils/logger'
import { getFirestore } from '../../services/firebase'
import { doc, getDoc } from 'firebase/firestore'

const router = useRouter()
const userStore = useUserStore()
const fileManager = useFileManager()

// Reactive data
const isDiagnosisRunning = ref(false)
const diagnosticsResults = ref<Array<{test: string, success: boolean, details?: string}> | null>(null)

// Computed
const isEmailVerified = computed(() => {
  return userStore.currentUser?.emailVerified || false
})
const cloudStatusColor = computed(() => {
  if (!userStore.isAuthenticated) return 'bg-gray-400'
  if (!fileManager.cloudSyncEnabled) return 'bg-yellow-500'
  
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'bg-blue-500 animate-pulse'
    case 'success': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
})

const cloudStatusTextColor = computed(() => {
  if (!userStore.isAuthenticated) return 'text-gray-600 dark:text-gray-400'
  if (!fileManager.cloudSyncEnabled) return 'text-yellow-600 dark:text-yellow-400'
  
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'text-blue-600 dark:text-blue-400'
    case 'success': return 'text-green-600 dark:text-green-400'
    case 'error': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
})

const cloudStatusText = computed(() => {
  if (!userStore.isAuthenticated) return 'Nicht angemeldet'
  if (!fileManager.cloudSyncEnabled) return 'Nicht aktiv'
  
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'Synchronisiert'
    case 'success': return 'Synchronisiert'
    case 'error': return 'Fehler'
    default: return 'Bereit'
  }
})

const lastSyncDisplay = computed(() => {
  if (!fileManager.lastCloudSyncTime) return 'Nie'
  
  const date = new Date(fileManager.lastCloudSyncTime)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 1) return 'Gerade eben'
  if (diffMins < 60) return `${diffMins}min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`
  
  return date.toLocaleDateString('de-DE')
})

const syncStatusText = computed(() => {
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'Läuft'
    case 'success': return 'OK'
    case 'error': return 'Fehler'
    default: return 'Bereit'
  }
})

const syncStatusColor = computed(() => {
  switch (fileManager.cloudSyncStatus) {
    case 'syncing': return 'text-blue-600 dark:text-blue-400'
    case 'success': return 'text-green-600 dark:text-green-400'
    case 'error': return 'text-red-600 dark:text-red-400'
    default: return 'text-gray-600 dark:text-gray-400'
  }
})

const showMigrationButton = computed(() => {
  // Show migration button if user has local songs with old IDs (number or long string IDs from old structure)
  return fileManager.songs.some(song => 
    typeof song.id === 'number' || 
    (typeof song.id === 'string' && song.id.length > 15) // Old Firestore IDs from previous structure
  )
})

// Methods
const goToLogin = () => {
  router.push('/login')
}

const handleManualSync = async () => {
  if (!userStore.userId) return
  
  try {
    await fileManager.syncSongsToCloud(userStore.userId)
  } catch (error) {
    sync('Manual sync failed:', error)
  }
}

const handleMigration = async () => {
  if (!userStore.userId) return
  
  try {
    await fileManager.migrateToNewCloudStructure(userStore.userId)
  } catch (err: any) {
    console.error('Migration failed:', err)
  }
}

const handleLoadFromCloud = async () => {
  if (!userStore.userId) return
  
  try {
    await fileManager.loadSongsFromCloud(userStore.userId)
  } catch (err: any) {
    sync('Load from cloud failed:', err)
  }
}

const runDiagnostics = async () => {
  isDiagnosisRunning.value = true
  diagnosticsResults.value = []
  
  try {
    // Test 1: Internet connection
    try {
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
      diagnosticsResults.value.push({
        test: '🌐 Internet-Verbindung',
        success: true,
        details: 'Internetverbindung funktioniert'
      })
    } catch {
      diagnosticsResults.value.push({
        test: '🌐 Internet-Verbindung',
        success: false,
        details: 'Keine Internetverbindung oder durch Proxy/VPN blockiert'
      })
    }

    // Test 2: Firebase connectivity
    try {
      const firestore = await getFirestore()
      await getDoc(doc(firestore, 'test', 'connectivity'))
      diagnosticsResults.value.push({
        test: '🔥 Firebase-Verbindung',
        success: true,
        details: 'Firebase ist erreichbar'
      })
    } catch (err: any) {
      let details = 'Firebase nicht erreichbar'
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        details = 'Von Ad-Blocker oder Netzwerkfilter blockiert'
      }
      diagnosticsResults.value.push({
        test: '🔥 Firebase-Verbindung',
        success: false,
        details
      })
    }

    // Test 3: Authentication status
    const user = userStore.currentUser
    if (user) {
      diagnosticsResults.value.push({
        test: '🔐 Benutzer angemeldet',
        success: true,
        details: `E-Mail: ${user.email}`
      })
      
      // Test 4: Email verification
      diagnosticsResults.value.push({
        test: '📧 E-Mail verifiziert',
        success: user.emailVerified,
        details: user.emailVerified ? 'E-Mail ist bestätigt' : 'E-Mail muss noch bestätigt werden'
      })
    } else {
      diagnosticsResults.value.push({
        test: '🔐 Benutzer angemeldet',
        success: false,
        details: 'Nicht angemeldet'
      })
    }

    // Test 5: Ad-Blocker detection
    try {
      const testResponse = await fetch('https://googleads.g.doubleclick.net/pagead/id', { mode: 'no-cors' })
      diagnosticsResults.value.push({
        test: '🚫 Ad-Blocker-Check',
        success: true,
        details: 'Kein Ad-Blocker erkannt'
      })
    } catch {
      diagnosticsResults.value.push({
        test: '🚫 Ad-Blocker-Check',
        success: false,
        details: 'Ad-Blocker oder Netzwerkfilter aktiv - kann Firebase blockieren'
      })
    }

    // Test 6: Cloud sync status
    if (fileManager.cloudSyncEnabled) {
      diagnosticsResults.value.push({
        test: '☁️ Cloud Sync',
        success: fileManager.cloudSyncStatus === 'success' || fileManager.cloudSyncStatus === 'idle',
        details: `Status: ${fileManager.cloudSyncStatus}`
      })
    } else {
      diagnosticsResults.value.push({
        test: '☁️ Cloud Sync',
        success: false,
        details: 'Cloud Sync ist deaktiviert'
      })
    }

  } catch (err: any) {
    console.error('Diagnosis error:', err)
  } finally {
    isDiagnosisRunning.value = false
  }
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