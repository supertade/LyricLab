<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, onBeforeMount } from 'vue'
import { useFileManager } from './stores/fileManager'
import { useUserStore } from './stores/user'
import { getPreferredDarkMode, updateDarkModePreference } from './config/appConfig'
import SplashScreen from './components/ui/SplashScreen.vue'
import AppConfirmDialog from './components/ui/AppConfirmDialog.vue'
import EmailVerificationStatus from './components/auth/EmailVerificationStatus.vue'
import DebugConsole from './components/debug/DebugConsole.vue'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from './utils/logger'
import firebaseAuth from './services/firebase'

const fileManager = useFileManager()
const userStore = useUserStore()
const isDarkMode = ref(false)
const isInitializing = ref(true)
const showSplash = ref(true)

// Debug console
const showDebugConsole = ref(false)
const isLongPressing = ref(false)
const longPressTimer = ref<number | null>(null)
const longPressProgress = ref(0)

// Apply dark mode immediately before mounting
onBeforeMount(() => {
  isDarkMode.value = getPreferredDarkMode()
  document.documentElement.classList.toggle('dark', isDarkMode.value)
})

// Methods
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  updateDarkModePreference(isDarkMode.value)
}

// Long press debug console (top-right corner)
const startLongPress = (event: TouchEvent | MouseEvent) => {
  // Check if touch/click is in top-right corner (last 80px)
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  const x = 'touches' in event ? event.touches[0].clientX : event.clientX
  const y = 'touches' in event ? event.touches[0].clientY : event.clientY
  
  // Only trigger in top-right corner (80x80px)
  if (x < window.innerWidth - 80 || y > 80) {
    return
  }
  
  isLongPressing.value = true
  longPressProgress.value = 0
  
  // Prevent default to avoid context menu
  event.preventDefault()
  
  // Start progress animation
  const duration = 2500 // 2.5 seconds
  const interval = 50 // Update every 50ms
  const step = (interval / duration) * 100
  
  const progressTimer = setInterval(() => {
    longPressProgress.value += step
    if (longPressProgress.value >= 100) {
      clearInterval(progressTimer)
      showDebugConsole.value = true
      endLongPress()
    }
  }, interval)
  
  longPressTimer.value = progressTimer
}

const endLongPress = () => {
  isLongPressing.value = false
  longPressProgress.value = 0
  if (longPressTimer.value) {
    clearInterval(longPressTimer.value)
    longPressTimer.value = null
  }
}

const closeDebugConsole = () => {
  showDebugConsole.value = false
}

// Add a watch to handle class changes smoothly
watch(isDarkMode, (newValue) => {
  document.documentElement.classList.toggle('dark', newValue)
})

onMounted(async () => {
  isInitializing.value = true
  
  try {
    // Initialize Firebase Authentication and wait for it to complete
    userStore.initializeAuth()
    
    // Wait for auth to be initialized
    while (!userStore.isAuthInitialized) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    auth('Firebase Auth initialized')
    
    // Check and refresh verification status for authenticated users
    if (userStore.isAuthenticated && userStore.userId) {
      try {
        const isVerified = await userStore.refreshVerificationStatus()
        auth(`🔍 Verification status check: ${isVerified ? 'verified' : 'not verified'}`)
      } catch (error) {
        auth('⚠️ Failed to check verification status:', error)
      }
    }
    
    // Load songs from localStorage
    await fileManager.loadSongs()
    
    // Enable cloud sync if user is authenticated and email is verified
    if (userStore.isAuthenticated && userStore.userId) {
      // Use the user store data instead of direct Firebase calls
      const user = userStore.currentUser
      auth(`Current user from store:`, user)
      
      if (user && user.emailVerified) {
        sync('🔄 User authenticated with verified email, enabling cloud sync...')
        try {
          // Check network connectivity first
          const isConnected = navigator.onLine
          if (!isConnected) {
            sync('⚠️ Device appears to be offline, skipping cloud sync initialization')
          } else {
            await fileManager.enableCloudSync(userStore.userId)
            await fileManager.loadSongsFromCloud(userStore.userId)
          }
        } catch (error: any) {
          sync('⚠️ Cloud sync initialization failed:', error)
          // Don't fail the entire app if cloud sync fails
          if (error?.message?.includes('client is offline')) {
            sync('💡 Firestore appears to be in offline mode, will retry later')
          }
        }
      } else {
        sync(`🔄 User authenticated but email not verified (${user?.email}), cloud sync disabled`)
        auth(`Email verification status: ${user?.emailVerified}`)
      }
    } else {
      auth('User not authenticated on startup')
    }
  } catch (error) {
    error('Error initializing app:', error)
  } finally {
    // Mark initialization as complete
    isInitializing.value = false
    
    // Show splash screen a bit longer to complete animations
    setTimeout(() => {
      showSplash.value = false
    }, 3500) // Increased from 2200 to allow for the more complex building animation to complete
  }

  // No need for additional event listeners with the new long press system
})

onUnmounted(() => {
  if (longPressTimer.value) {
    clearInterval(longPressTimer.value)
  }
})

// Watch for authentication changes and sync cloud accordingly
watch(() => userStore.isAuthenticated, async (isAuthenticated, wasAuthenticated) => {
  if (isAuthenticated && userStore.userId) {
    // User logged in - check email verification before enabling cloud sync
    const user = userStore.currentUser
    if (user && user.emailVerified) {
      sync('🔄 User authenticated with verified email, enabling cloud sync...')
      try {
        await fileManager.enableCloudSync(userStore.userId)
        await fileManager.loadSongsFromCloud(userStore.userId)
      } catch (error) {
        sync('⚠️ Cloud sync enable failed:', error)
      }
    } else {
      sync(`🔄 User authenticated but email not verified (${user?.email}), cloud sync disabled`)
      auth(`Email verification status: ${user?.emailVerified}`)
      auth(`User data from store:`, user)
    }
  } else if (wasAuthenticated && !isAuthenticated) {
    // User logged out - disable cloud sync
    sync('🔄 User logged out, disabling cloud sync...')
    fileManager.disableCloudSync()
  }
})

// Watch for email verification changes
watch(() => {
  const currentUser = firebaseAuth.getCurrentUser()
  return currentUser ? currentUser.emailVerified : false
}, async (isEmailVerified) => {
  if (isEmailVerified && userStore.isAuthenticated && userStore.userId) {
    // Email was just verified - enable cloud sync
    sync('✅ Email verified, enabling cloud sync...')
    try {
      await fileManager.enableCloudSync(userStore.userId)
      await fileManager.loadSongsFromCloud(userStore.userId)
    } catch (error) {
      sync('⚠️ Cloud sync enable after verification failed:', error)
    }
  }
})
</script>

<template>
  <div class="h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-800 dark:text-white overflow-hidden" :class="{ 'dark': isDarkMode }">
    <!-- Cool animated splash screen -->
    <transition name="splash-fade">
      <SplashScreen v-if="showSplash" />
    </transition>
    
    <!-- App-Ansicht (hidden until initialization and splash are done) -->
    <div v-show="!isInitializing && !showSplash" class="flex-1 overflow-hidden">
      <router-view 
        v-slot="{ Component }"
      >
        <transition name="page-slide" mode="out-in">
          <suspense>
            <component 
              :is="Component" 
              :is-dark-mode="isDarkMode" 
              @toggle-dark-mode="toggleDarkMode" 
              class="h-full"
            />
            <template #fallback>
              <div class="flex h-full items-center justify-center">
                <div class="animate-pulse text-blue-500">Loading...</div>
              </div>
            </template>
          </suspense>
        </transition>
      </router-view>
    </div>
    
    <!-- Global app confirmation dialog -->
    <AppConfirmDialog />
    
    <!-- Email Verification Status Modal -->
    <EmailVerificationStatus />
    
    <!-- Debug Console -->
    <DebugConsole 
      :visible="showDebugConsole" 
      @close="closeDebugConsole" 
    />
    
    <!-- Long Press Debug Indicator (Top-Right Corner) -->
    <div 
      v-if="isLongPressing"
      class="fixed top-4 right-4 w-12 h-12 rounded-full bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center z-50"
    >
      <div 
        class="w-8 h-8 rounded-full bg-blue-500 transition-all duration-75"
        :style="{ transform: `scale(${longPressProgress / 100})` }"
      ></div>
      <div class="absolute inset-0 rounded-full border-2 border-blue-500" 
           :style="{ 
             background: `conic-gradient(from 0deg, #3b82f6 ${longPressProgress * 3.6}deg, transparent ${longPressProgress * 3.6}deg)`,
             mask: 'radial-gradient(circle, transparent 60%, black 60%)'
           }">
      </div>
    </div>
  </div>
</template>

<style>
/* Smooth transitions for all elements */
* {
  @apply transition-colors duration-200;
}

/* Splash screen fade transition */
.splash-fade-leave-active {
  transition: opacity 0.5s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}

/* Page transition animation */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: opacity 0.2s ease;
  will-change: opacity, transform;
}

.page-slide-enter-from {
  opacity: 0;
}

.page-slide-leave-to {
  opacity: 0;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Apply iOS-style momentum scrolling */
.editor-container, body {
  -webkit-overflow-scrolling: touch;
}

/* Focus styles */
:focus-visible {
  @apply outline-2 outline-blue-500 outline-offset-2;
}

/* Improved scrollbars */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-transparent;
}

::-webkit-scrollbar-thumb {
  @apply bg-gray-300 dark:bg-gray-700 rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-gray-400 dark:bg-gray-600;
}
</style>
