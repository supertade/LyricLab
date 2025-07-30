<template>
  <div class="account-editor">
    <!-- Current Account Info -->
    <div class="card p-6 mb-4">
      <div class="flex items-center space-x-4 mb-6">
        <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
          <span class="text-white font-bold text-xl">
            {{ userInitials }}
          </span>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Account bearbeiten
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ userStore.userEmail }}
          </p>
        </div>
      </div>

      <!-- Account Actions -->
      <div class="space-y-3">
        <!-- Change Email Button -->
        <Button
          @click="showEmailForm = !showEmailForm"
          variant="secondary"
          size="md"
          full-width
          class="justify-center"
        >
          <template #icon-left>
            <Icon name="info" class="w-4 h-4" />
          </template>
          E-Mail ändern
        </Button>

        <!-- Change Password Button -->
        <Button
          @click="showPasswordForm = !showPasswordForm"
          variant="secondary"
          size="md"
          full-width
          class="justify-center"
        >
          <template #icon-left>
            <Icon name="settings" class="w-4 h-4" />
          </template>
          Passwort ändern
        </Button>
      </div>
    </div>

    <!-- Change Email Form -->
    <div v-if="showEmailForm" class="card p-6 mb-4">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-4">E-Mail ändern</h4>
      
      <form @submit.prevent="handleEmailChange" class="space-y-4">
        <div>
          <label for="newEmail" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Neue E-Mail-Adresse
          </label>
          <input
            id="newEmail"
            v-model="newEmail"
            type="email"
            required
            placeholder="neue.email@beispiel.de"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aktuelles Passwort (zur Bestätigung)
          </label>
          <input
            id="currentPassword"
            v-model="currentPasswordForEmail"
            type="password"
            required
            placeholder="Ihr aktuelles Passwort"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
            :disabled="isLoading"
          />
        </div>

        <div class="flex space-x-3">
          <Button
            type="submit"
            variant="primary"
            :disabled="isLoading || !newEmail || !currentPasswordForEmail"
          >
            <template v-if="isLoading && currentAction === 'email'" #icon-left>
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </template>
            {{ isLoading && currentAction === 'email' ? 'Änderung läuft...' : 'E-Mail ändern' }}
          </Button>
          
          <Button
            type="button"
            @click="cancelEmailChange"
            variant="ghost"
            :disabled="isLoading"
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>

    <!-- Change Password Form -->
    <div v-if="showPasswordForm" class="card p-6 mb-4">
      <h4 class="font-semibold text-gray-900 dark:text-white mb-4">Passwort ändern</h4>
      
      <form @submit.prevent="handlePasswordChange" class="space-y-4">
        <div>
          <label for="oldPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Aktuelles Passwort
          </label>
          <input
            id="oldPassword"
            v-model="oldPassword"
            type="password"
            required
            placeholder="Ihr aktuelles Passwort"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Neues Passwort
          </label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            required
            placeholder="Mindestens 6 Zeichen"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
            :disabled="isLoading"
          />
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Neues Passwort bestätigen
          </label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Passwort wiederholen"
            class="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white
                   placeholder-gray-500 dark:placeholder-gray-400
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   transition-all duration-200"
            :disabled="isLoading"
          />
        </div>

        <div class="flex space-x-3">
          <Button
            type="submit"
            variant="primary"
            :disabled="isLoading || !isPasswordFormValid"
          >
            <template v-if="isLoading && currentAction === 'password'" #icon-left>
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </template>
            {{ isLoading && currentAction === 'password' ? 'Änderung läuft...' : 'Passwort ändern' }}
          </Button>
          
          <Button
            type="button"
            @click="cancelPasswordChange"
            variant="ghost"
            :disabled="isLoading"
          >
            Abbrechen
          </Button>
        </div>
      </form>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="successMessage" class="card p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 mb-4">
      <div class="flex items-center space-x-3">
        <Icon name="info" class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
        <p class="text-sm text-green-700 dark:text-green-300">{{ successMessage }}</p>
      </div>
    </div>

    <div v-if="errorMessage" class="card p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
      <div class="flex items-center space-x-3">
        <Icon name="exclamation-triangle" class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <p class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth'
import { getCurrentUser } from '../../services/firebase'
import { auth as authLogger } from '../../utils/logger'

const userStore = useUserStore()

// Form visibility
const showEmailForm = ref(false)
const showPasswordForm = ref(false)

// Form data
const newEmail = ref('')
const currentPasswordForEmail = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// UI state
const isLoading = ref(false)
const currentAction = ref<'email' | 'password' | null>(null)
const successMessage = ref('')
const errorMessage = ref('')

// Computed
const userInitials = computed(() => {
  const email = userStore.userEmail
  if (!email) return '?'
  return email.charAt(0).toUpperCase()
})

const isPasswordFormValid = computed(() => {
  return oldPassword.value.length >= 6 &&
         newPassword.value.length >= 6 &&
         newPassword.value === confirmPassword.value
})

// Methods
const clearMessages = () => {
  successMessage.value = ''
  errorMessage.value = ''
}

const showSuccess = (message: string) => {
  clearMessages()
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 5000)
}

const showError = (message: string) => {
  clearMessages()
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 8000)
}

// Re-authenticate user (required for sensitive operations)
const reauthenticate = async (password: string) => {
  const user = await getCurrentUser()
  if (!user || !user.email) {
    throw new Error('Kein Benutzer angemeldet')
  }

  const credential = EmailAuthProvider.credential(user.email, password)
  await reauthenticateWithCredential(user, credential)
}

// Email change
const handleEmailChange = async () => {
  if (!newEmail.value || !currentPasswordForEmail.value) return

  isLoading.value = true
  currentAction.value = 'email'
  clearMessages()

  try {
    // Re-authenticate first
    await reauthenticate(currentPasswordForEmail.value)
    
    // Update email
    const user = await getCurrentUser()
    if (!user) throw new Error('Kein Benutzer angemeldet')
    
    await updateEmail(user, newEmail.value)
    
    // Update user store
    if (userStore.currentUser) {
      userStore.currentUser.email = newEmail.value
      userStore.setUser(userStore.currentUser)
    }
    
    showSuccess('E-Mail-Adresse erfolgreich geändert!')
    cancelEmailChange()
  } catch (error: any) {
    authLogger.error('Email change failed:', error)
    if (error.code === 'auth/wrong-password') {
      showError('Falsches Passwort eingegeben.')
    } else if (error.code === 'auth/email-already-in-use') {
      showError('Diese E-Mail-Adresse wird bereits verwendet.')
    } else if (error.code === 'auth/invalid-email') {
      showError('Ungültige E-Mail-Adresse.')
    } else {
      showError('E-Mail konnte nicht geändert werden. Versuchen Sie es erneut.')
    }
  } finally {
    isLoading.value = false
    currentAction.value = null
  }
}

// Password change
const handlePasswordChange = async () => {
  if (!isPasswordFormValid.value) return

  isLoading.value = true
  currentAction.value = 'password'
  clearMessages()

  try {
    // Re-authenticate first
    await reauthenticate(oldPassword.value)
    
    // Update password
    const user = await getCurrentUser()
    if (!user) throw new Error('Kein Benutzer angemeldet')
    
    await updatePassword(user, newPassword.value)
    
    showSuccess('Passwort erfolgreich geändert!')
    cancelPasswordChange()
  } catch (error: any) {
    authLogger.error('Password change failed:', error)
    if (error.code === 'auth/wrong-password') {
      showError('Aktuelles Passwort ist falsch.')
    } else if (error.code === 'auth/weak-password') {
      showError('Das neue Passwort ist zu schwach.')
    } else {
      showError('Passwort konnte nicht geändert werden. Versuchen Sie es erneut.')
    }
  } finally {
    isLoading.value = false
    currentAction.value = null
  }
}

// Cancel actions
const cancelEmailChange = () => {
  showEmailForm.value = false
  newEmail.value = ''
  currentPasswordForEmail.value = ''
  clearMessages()
}

const cancelPasswordChange = () => {
  showPasswordForm.value = false
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  clearMessages()
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