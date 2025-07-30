<template>
  <div v-if="isVisible" class="debug-console fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
      <div class="flex items-center space-x-3">
        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <h2 class="text-white font-mono text-lg">🐛 Debug Console</h2>
        <span class="text-xs text-gray-400">v1.0.3</span>
      </div>
      <button @click="close" class="text-gray-400 hover:text-white text-xl font-bold">✕</button>
    </div>

    <!-- Tabs -->
    <div class="flex bg-gray-800 border-b border-gray-700">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-2 text-sm font-mono transition-colors',
          activeTab === tab.id 
            ? 'bg-blue-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-gray-700'
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-hidden">
      <!-- Console Tab -->
      <div v-show="activeTab === 'console'" class="h-full flex flex-col">
        <div class="p-2 bg-gray-800 border-b border-gray-700 flex space-x-2">
          <button @click="clearLogs" class="px-3 py-1 bg-red-600 text-white rounded text-xs font-mono">Clear</button>
          <button @click="exportLogs" class="px-3 py-1 bg-blue-600 text-white rounded text-xs font-mono">Export</button>
          <span class="text-xs text-gray-400 self-center">{{ logs.length }} entries</span>
        </div>
        <div ref="logContainer" class="flex-1 overflow-y-auto p-2 font-mono text-xs">
          <div 
            v-for="(log, index) in logs" 
            :key="index"
            :class="[
              'mb-1 p-1 rounded border-l-2',
              getLogStyle(log.level)
            ]"
          >
            <span class="text-gray-500">{{ log.timestamp }}</span>
            <span :class="getLogTextStyle(log.level)">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <!-- Firebase Tab -->
      <div v-show="activeTab === 'firebase'" class="h-full overflow-y-auto p-4">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-2">
            <button @click="testFirebaseConnection" :disabled="isTestRunning" class="debug-btn">
              🔥 Firebase Test
            </button>
            <button @click="testAuth" :disabled="isTestRunning" class="debug-btn">
              🔐 Auth Test
            </button>
            <button @click="testFirestore" :disabled="isTestRunning" class="debug-btn">
              📄 Firestore Test
            </button>
            <button @click="testCloudSync" :disabled="isTestRunning" class="debug-btn">
              ☁️ Sync Test
            </button>
            <button @click="testNetworkConnectivity" :disabled="isTestRunning" class="debug-btn">
              🌐 Network Test
            </button>
            <button @click="testAllSystems" :disabled="isTestRunning" class="debug-btn">
              🧪 Run All Tests
            </button>
            <button @click="resetFirebaseConnection" :disabled="isTestRunning" class="debug-btn bg-red-600 hover:bg-red-700">
              🔄 Reset Firebase
            </button>
            <button @click="testPlatformSpecificFeatures" :disabled="isTestRunning" class="debug-btn bg-purple-600 hover:bg-purple-700">
              🔧 Platform Test
            </button>
          </div>
          
          <!-- Test Results -->
          <div v-if="testResults.length > 0" class="mt-4">
            <h3 class="text-white font-mono mb-2">Test Results:</h3>
            <div class="space-y-2">
              <div 
                v-for="(result, index) in testResults" 
                :key="index"
                :class="[
                  'p-2 rounded border-l-4 font-mono text-xs',
                  result.success 
                    ? 'bg-green-900/50 border-green-500 text-green-200' 
                    : 'bg-red-900/50 border-red-500 text-red-200'
                ]"
              >
                <div class="font-bold">{{ result.test }}</div>
                <div class="text-xs opacity-80">{{ result.details }}</div>
                <div class="text-xs text-gray-400 mt-1">{{ result.timestamp }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Info Tab -->
      <div v-show="activeTab === 'system'" class="h-full overflow-y-auto p-4 font-mono text-xs">
        <div class="grid grid-cols-1 gap-4">
          <div class="bg-gray-800 p-3 rounded">
            <h3 class="text-white font-bold mb-2">App Info</h3>
            <div class="text-gray-300 space-y-1">
              <div>Version: {{ appVersion }}</div>
              <div>Build: {{ buildInfo }}</div>
              <div>Platform: {{ platform }}</div>
              <div>User Agent: {{ userAgent }}</div>
            </div>
          </div>
          
          <div class="bg-gray-800 p-3 rounded">
            <h3 class="text-white font-bold mb-2">User Status</h3>
            <div class="text-gray-300 space-y-1">
              <div>Authenticated: {{ userStore.isAuthenticated ? '✅' : '❌' }}</div>
              <div v-if="userStore.currentUser">Email: {{ userStore.currentUser.email }}</div>
              <div v-if="userStore.currentUser">Email Verified: {{ userStore.currentUser.emailVerified ? '✅' : '❌' }}</div>
              <div v-if="userStore.currentUser">UID: {{ userStore.currentUser.uid }}</div>
            </div>
          </div>

          <div class="bg-gray-800 p-3 rounded">
            <h3 class="text-white font-bold mb-2">Cloud Sync Status</h3>
            <div class="text-gray-300 space-y-1">
              <div>Enabled: {{ fileManager.cloudSyncEnabled ? '✅' : '❌' }}</div>
              <div>Status: {{ fileManager.cloudSyncStatus }}</div>
              <div v-if="fileManager.cloudSyncError">Error: {{ fileManager.cloudSyncError }}</div>
              <div>Songs Count: {{ fileManager.cloudSongsCount }}</div>
              <div>Last Sync: {{ fileManager.lastCloudSyncTime || 'Never' }}</div>
            </div>
          </div>

          <div class="bg-gray-800 p-3 rounded">
            <h3 class="text-white font-bold mb-2">Network Info</h3>
            <div class="text-gray-300 space-y-1">
                             <div>Online: {{ isOnline ? '✅' : '❌' }}</div>
              <div>Connection: {{ networkInfo.type || 'Unknown' }}</div>
              <div>Effective Type: {{ networkInfo.effectiveType || 'Unknown' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import { useFileManager } from '../../stores/fileManager'
import { getFirestore, getCurrentUser } from '../../services/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { Capacitor } from '@capacitor/core'

// Props
const props = defineProps<{
  visible: boolean
}>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Stores
const userStore = useUserStore()
const fileManager = useFileManager()

// Reactive data
const isVisible = computed(() => props.visible)
const activeTab = ref('console')
const logs = ref<Array<{level: string, message: string, timestamp: string}>>([])
const testResults = ref<Array<{test: string, success: boolean, details: string, timestamp: string}>>([])
const isTestRunning = ref(false)
const logContainer = ref<HTMLElement>()

// Computed properties for system info
const isOnline = computed(() => {
  try {
    return navigator.onLine
  } catch {
    return false
  }
})

// Tabs configuration
const tabs = [
  { id: 'console', label: '📟 Console' },
  { id: 'firebase', label: '🔥 Firebase' },
  { id: 'system', label: '📊 System' }
]

// System info
const appVersion = '1.0.3'
const buildInfo = 'Debug Build'
const platform = navigator.platform
const userAgent = navigator.userAgent
const networkInfo = ref<any>({})

// Methods
const close = () => {
  emit('close')
}

const addLog = (level: string, message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push({ level, message, timestamp })
  
  // Auto-scroll to bottom
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
  
  // Limit logs to 1000 entries
  if (logs.value.length > 1000) {
    logs.value = logs.value.slice(-1000)
  }
}

const clearLogs = () => {
  logs.value = []
}

const exportLogs = () => {
  const logText = logs.value.map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`).join('\n')
  
  // Create a blob and download
  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lyriclab-debug-${new Date().toISOString().slice(0, 19)}.log`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const getLogStyle = (level: string) => {
  switch (level) {
    case 'error': return 'bg-red-900/30 border-red-500 text-red-200'
    case 'warn': return 'bg-yellow-900/30 border-yellow-500 text-yellow-200'
    case 'info': return 'bg-blue-900/30 border-blue-500 text-blue-200'
    default: return 'bg-gray-800/30 border-gray-500 text-gray-300'
  }
}

const getLogTextStyle = (level: string) => {
  switch (level) {
    case 'error': return 'text-red-300'
    case 'warn': return 'text-yellow-300'
    case 'info': return 'text-blue-300'
    default: return 'text-gray-300'
  }
}

const addTestResult = (test: string, success: boolean, details: string) => {
  const timestamp = new Date().toLocaleTimeString()
  testResults.value.unshift({ test, success, details, timestamp })
  
  // Limit to 20 results
  if (testResults.value.length > 20) {
    testResults.value = testResults.value.slice(0, 20)
  }
}

// Test functions
const testFirebaseConnection = async () => {
  isTestRunning.value = true
  addLog('info', '🔥 Testing Firebase connection...')
  
  try {
    // Platform-specific testing
    if (Capacitor.isNativePlatform()) {
      addLog('info', '📱 Testing native Firebase plugins...')
      
      // Test native Firebase app
      try {
        const { FirebaseApp } = await import('@capacitor-firebase/app')
        const appInfo = await FirebaseApp.getName()
        addLog('info', `✅ Native Firebase App: ${appInfo.name}`)
        addTestResult('Firebase App (Native)', true, `App name: ${appInfo.name}`)
      } catch (error: any) {
        addLog('error', `❌ Native Firebase App failed: ${error.message}`)
        addTestResult('Firebase App (Native)', false, error.message)
      }
      
      // Test native Firestore if available
      try {
        const { FirebaseFirestore } = await import('@capacitor-firebase/firestore')
        addLog('info', '✅ Native Firestore plugin available')
        addTestResult('Firebase Firestore (Native)', true, 'Plugin available')
      } catch (error: any) {
        addLog('error', `❌ Native Firestore failed: ${error.message}`)
        addTestResult('Firebase Firestore (Native)', false, error.message)
      }
      
    } else {
      // Web testing
      addLog('info', '🌐 Testing web Firebase...')
      const firestore = await getFirestore()
      const testRef = doc(firestore, 'test', 'connectivity')
      await getDoc(testRef)
      addTestResult('Firebase Connection', true, 'Successfully connected to Firestore')
      addLog('info', '✅ Web Firebase connection successful')
    }
  } catch (error: any) {
    addTestResult('Firebase Connection', false, `Error: ${error.message}`)
    addLog('error', `❌ Firebase connection failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const testPlatformSpecificFeatures = async () => {
  isTestRunning.value = true
  addLog('info', '🔧 Testing platform-specific features...')
  
  try {
    addLog('info', `Platform: ${Capacitor.getPlatform()}`)
    addLog('info', `Is Native: ${Capacitor.isNativePlatform()}`)
    addLog('info', `Is Web: ${Capacitor.getPlatform() === 'web'}`)
    
    // Test Capacitor plugins availability
    const plugins = [
      '@capacitor/device',
      '@capacitor/network', 
      '@capacitor-firebase/app',
      '@capacitor-firebase/authentication',
      '@capacitor-firebase/firestore'
    ]
    
    for (const plugin of plugins) {
      try {
        await import(plugin)
        addLog('info', `✅ ${plugin} available`)
      } catch {
        addLog('warn', `⚠️ ${plugin} not available`)
      }
    }
    
    addTestResult('Platform Features', true, `Platform: ${Capacitor.getPlatform()}`)
  } catch (error: any) {
    addTestResult('Platform Features', false, error.message)
    addLog('error', `❌ Platform test failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const resetFirebaseConnection = async () => {
  isTestRunning.value = true
  addLog('info', '🔄 Resetting Firebase connection...')
  
  try {
    if (Capacitor.isNativePlatform()) {
      addLog('info', '📱 Resetting native Firebase connection...')
      // For native platforms, we can't really "reset" the connection
      // but we can test if plugins are working
      try {
        const { FirebaseApp } = await import('@capacitor-firebase/app')
        await FirebaseApp.getName()
        addTestResult('Firebase Reset (Native)', true, 'Native plugins functioning')
        addLog('info', '✅ Native Firebase plugins working correctly')
      } catch (error: any) {
        addTestResult('Firebase Reset (Native)', false, error.message)
        addLog('error', `❌ Native Firebase reset failed: ${error.message}`)
      }
    } else {
      addLog('info', '🌐 Resetting web Firebase connection...')
      const { disableNetwork, enableNetwork } = await import('firebase/firestore')
      
      // Force disable and re-enable Firestore network
      addLog('info', '📴 Disabling Firestore network...')
      const firestore = await getFirestore()
      await disableNetwork(firestore)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      addLog('info', '📶 Re-enabling Firestore network...')
      await enableNetwork(firestore)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Test connection after reset
      const testRef = doc(firestore, 'test', 'connectivity')
      await getDoc(testRef)
      
      addTestResult('Firebase Reset', true, 'Connection reset successful')
      addLog('info', '✅ Firebase connection reset and working')
    }
  } catch (error: any) {
    addTestResult('Firebase Reset', false, `Error: ${error.message}`)
    addLog('error', `❌ Firebase reset failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const testAuth = async () => {
  isTestRunning.value = true
  addLog('info', '🔐 Testing authentication...')
  
  try {
    const currentUser = await getCurrentUser()
    if (currentUser) {
      if (typeof currentUser.reload === 'function') {
        await currentUser.reload()
      }
      addTestResult('Authentication', true, `User: ${currentUser.email}, Verified: ${currentUser.emailVerified}`)
      addLog('info', `✅ Auth successful: ${currentUser.email}`)
    } else {
      addTestResult('Authentication', false, 'No user currently logged in')
      addLog('warn', '⚠️ No user logged in')
    }
  } catch (error: any) {
    addTestResult('Authentication', false, `Error: ${error.message}`)
    addLog('error', `❌ Auth test failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const testFirestore = async () => {
  isTestRunning.value = true
  addLog('info', '📄 Testing Firestore operations...')
  
  try {
    if (!userStore.userId) {
      throw new Error('User not authenticated')
    }

    // Test read
    const firestore = await getFirestore()
    const userRef = doc(firestore, 'users', userStore.userId)
    await getDoc(userRef)
    addLog('info', '✅ Firestore read successful')

    // Test write
    await setDoc(userRef, { 
      lastDebugTest: new Date().toISOString(),
      debugVersion: appVersion 
    }, { merge: true })
    
    addTestResult('Firestore Operations', true, 'Read and write operations successful')
    addLog('info', '✅ Firestore write successful')
  } catch (error: any) {
    addTestResult('Firestore Operations', false, `Error: ${error.message}`)
    addLog('error', `❌ Firestore test failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const testCloudSync = async () => {
  isTestRunning.value = true
  addLog('info', '☁️ Testing cloud sync...')
  
  try {
    if (!userStore.userId) {
      throw new Error('User not authenticated')
    }

    const result = await fileManager.checkCloudAvailability(userStore.userId)
    if (result) {
      addTestResult('Cloud Sync', true, 'Cloud storage is available')
      addLog('info', '✅ Cloud sync available')
      
      // Try to get sync status
      const status = await fileManager.getCloudSyncStatus(userStore.userId)
      if (status) {
        addLog('info', `📊 Sync status: ${status.totalSongs} songs, last sync: ${status.lastSyncTime || 'never'}`)
      }
    } else {
      addTestResult('Cloud Sync', false, 'Cloud storage not available')
      addLog('error', '❌ Cloud sync not available')
    }
  } catch (error: any) {
    addTestResult('Cloud Sync', false, `Error: ${error.message}`)
    addLog('error', `❌ Cloud sync test failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const testNetworkConnectivity = async () => {
  isTestRunning.value = true
  addLog('info', '🌐 Testing network connectivity...')
  
  try {
    // Test basic internet
    const response = await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
    addLog('info', '✅ Basic internet connectivity works')
    
    // Test Firebase specific
    const firebaseResponse = await fetch('https://firebase.googleapis.com/', { mode: 'no-cors' })
    addLog('info', '✅ Firebase domains reachable')
    
    addTestResult('Network Connectivity', true, 'All network tests passed')
  } catch (error: any) {
    addTestResult('Network Connectivity', false, `Error: ${error.message}`)
    addLog('error', `❌ Network test failed: ${error.message}`)
  } finally {
    isTestRunning.value = false
  }
}

const testAllSystems = async () => {
  isTestRunning.value = true
  addLog('info', '🧪 Running comprehensive system test...')
  
  await testNetworkConnectivity()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  await testFirebaseConnection()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  await testAuth()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  if (userStore.isAuthenticated) {
    await testFirestore()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testCloudSync()
  }
  
  addLog('info', '✅ All system tests completed')
  isTestRunning.value = false
}

// Intercept console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
}

const interceptConsole = () => {
  console.log = (...args) => {
    addLog('log', args.join(' '))
    originalConsole.log(...args)
  }
  
  console.error = (...args) => {
    addLog('error', args.join(' '))
    originalConsole.error(...args)
  }
  
  console.warn = (...args) => {
    addLog('warn', args.join(' '))
    originalConsole.warn(...args)
  }
  
  console.info = (...args) => {
    addLog('info', args.join(' '))
    originalConsole.info(...args)
  }
}

const restoreConsole = () => {
  console.log = originalConsole.log
  console.error = originalConsole.error
  console.warn = originalConsole.warn
  console.info = originalConsole.info
}

// Update network info
const updateNetworkInfo = () => {
  // @ts-ignore
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (connection) {
    networkInfo.value = {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }
}

// Lifecycle
onMounted(() => {
  interceptConsole()
  updateNetworkInfo()
  addLog('info', '🐛 Debug console initialized')
  
  // Listen for network changes
  window.addEventListener('online', () => addLog('info', '🌐 Network: Online'))
  window.addEventListener('offline', () => addLog('warn', '🌐 Network: Offline'))
})

onUnmounted(() => {
  restoreConsole()
})
</script>

<style scoped>
.debug-console {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.debug-btn {
  @apply px-3 py-2 bg-gray-700 text-white rounded text-xs font-mono
         hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}
</style> 