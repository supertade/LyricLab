<template>
  <div v-if="showVerificationPrompt" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="card w-full max-w-md p-6 space-y-4">
      <div class="text-center">
        <div class="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="mail" class="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          E-Mail-Bestätigung erforderlich
        </h2>
        
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Bitte bestätigen Sie Ihre E-Mail-Adresse, um alle Funktionen nutzen zu können.
        </p>
        
        <div class="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
          <strong>{{ userEmail }}</strong>
        </div>
      </div>

      <div class="space-y-3">
        <Button
          @click="resendVerificationEmail"
          :disabled="isLoading || resendCooldown > 0"
          variant="primary"
          size="md"
          full-width
        >
          <template v-if="isLoading" #icon-left>
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </template>
          {{ resendCooldown > 0 ? `Erneut senden in ${resendCooldown}s` : 'Bestätigungs-E-Mail erneut senden' }}
        </Button>

        <Button
          @click="checkVerificationStatus"
          :disabled="isChecking"
          variant="secondary"
          size="md"
          full-width
        >
          <template v-if="isChecking" #icon-left>
            <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          </template>
          {{ isChecking ? 'Überprüfung läuft...' : 'Bestätigung überprüfen' }}
        </Button>

        <Button
          @click="signOut"
          variant="ghost"
          size="md"
          full-width
        >
          Abmelden
        </Button>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <p class="text-sm text-green-700 dark:text-green-300 flex items-center">
          <Icon name="info" class="w-4 h-4 mr-2 flex-shrink-0" />
          {{ successMessage }}
        </p>
      </div>

      <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p class="text-sm text-red-700 dark:text-red-400 flex items-center">
          <Icon name="exclamation-triangle" class="w-4 h-4 mr-2 flex-shrink-0" />
          {{ errorMessage }}
        </p>
      </div>

      <!-- Instructions -->
      <div class="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
        <p>Überprüfen Sie auch Ihren Spam-Ordner.</p>
        <p class="mt-1">Die E-Mail kann bis zu 5 Minuten dauern.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '../../stores/user'
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import firebaseAuth, { type AuthError, getCurrentUser } from '../../services/firebase'
import { auth } from '../../services/firebase'

const userStore = useUserStore()

// Reactive data
const isLoading = ref(false)
const isChecking = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const resendCooldown = ref(0)
const checkInterval = ref<number | null>(null)

// Computed
const userEmail = computed(() => userStore.userEmail)
  const showVerificationPrompt = computed(() => {
    return userStore.isAuthenticated && userStore.currentUser && !userStore.currentUser.emailVerified
  })

// Methods
const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

const resendVerificationEmail = async () => {
  if (resendCooldown.value > 0 || isLoading.value) return
  
  clearMessages()
  isLoading.value = true
  
  try {
    // Check for auth state mismatch first
    const hasValidAuth = await userStore.handleAuthStateMismatch()
    if (!hasValidAuth) {
      errorMessage.value = 'Anmeldung abgelaufen. Bitte melden Sie sich erneut an.'
      return
    }
    
    // First check if already verified
    const isVerified = await firebaseAuth.reloadUser()
    
    if (isVerified && userStore.currentUser) {
      // Update user store with verified status
      userStore.setUser({
        ...userStore.currentUser,
        emailVerified: true
      })
      successMessage.value = 'E-Mail ist bereits bestätigt!'
    } else {
      // Send verification email
      await firebaseAuth.sendEmailVerification()
      successMessage.value = 'Bestätigungs-E-Mail wurde erneut gesendet!'
      
      // Start cooldown timer
      resendCooldown.value = 60
      const timer = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    }
    
  } catch (error) {
    const authError = error as AuthError
    if (authError.message?.includes('No user is signed in')) {
      errorMessage.value = 'Anmeldung abgelaufen. Bitte melden Sie sich erneut an.'
      // Clear any cached auth data
      userStore.clearAuthData()
    } else {
      errorMessage.value = authError.message
    }
  } finally {
    isLoading.value = false
  }
}

const checkVerificationStatus = async () => {
  if (isChecking.value) return
  
  clearMessages()
  isChecking.value = true
  
  try {
    // Check for auth state mismatch first
    const hasValidAuth = await userStore.handleAuthStateMismatch()
    if (!hasValidAuth) {
      errorMessage.value = 'Anmeldung abgelaufen. Bitte melden Sie sich erneut an.'
      return
    }
    
    // Use the user store's refresh function for consistency
    const isVerified = await userStore.refreshVerificationStatus()
    
    if (isVerified) {
      successMessage.value = 'E-Mail erfolgreich bestätigt! Sie werden weitergeleitet...'
      
      // Wait a moment for the success message to be visible, then redirect
      setTimeout(() => {
        // The verification prompt will disappear automatically due to reactive computed
        // Force a page refresh to ensure the app recognizes the verified status
        window.location.reload()
      }, 1500)
      
    } else {
      errorMessage.value = 'E-Mail-Adresse noch nicht bestätigt. Bitte überprüfen Sie Ihre E-Mails.'
    }
  } catch (error) {
    const authError = error as AuthError
    if (authError.message?.includes('No user is signed in')) {
      errorMessage.value = 'Anmeldung abgelaufen. Bitte melden Sie sich erneut an.'
      // Clear any cached auth data
      userStore.clearAuthData()
    } else {
      errorMessage.value = authError.message
    }
  } finally {
    isChecking.value = false
  }
}

const signOut = async () => {
  try {
    await userStore.logout()
  } catch (error) {
    console.error('Logout failed:', error)
    // Force clear cached data even if logout fails
    userStore.clearAuthData()
    // Reload page to reset state
    window.location.reload()
  }
}

// Auto-check verification status periodically
const startAutoCheck = () => {
  checkInterval.value = window.setInterval(async () => {
    if (showVerificationPrompt.value && !isChecking.value) {
      // Silent check without UI feedback for auto-check
      try {
        // Use the user store's refresh function for auto-check
        const isVerified = await userStore.refreshVerificationStatus()
        
        if (isVerified) {
          // Email was verified! Show success and redirect
          successMessage.value = 'E-Mail erfolgreich bestätigt! Sie werden weitergeleitet...'
          
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      } catch (error) {
        // Silent fail for auto-check
        console.log('Auto-check failed:', error)
      }
    }
  }, 10000) // Check every 10 seconds
}

// Lifecycle
onMounted(() => {
  startAutoCheck()
})

onUnmounted(() => {
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
    checkInterval.value = null
  }
})
</script>

<style scoped>
.card {
  @apply bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-lg 
         border border-gray-200/50 dark:border-white/10 overflow-hidden;
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