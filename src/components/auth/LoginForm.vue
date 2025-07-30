<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
    <div class="card w-full max-w-md p-8 space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Willkommen zurück
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Melden Sie sich in Ihrem Account an
        </p>
      </div>

      <!-- Email Verification Warning -->
      <div v-if="showEmailVerificationWarning" class="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div class="flex items-start space-x-3">
          <Icon name="exclamation-triangle" class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-amber-700 dark:text-amber-300">
            <p class="font-medium mb-1">E-Mail-Bestätigung erforderlich</p>
            <p class="mb-3">Bitte bestätigen Sie Ihre E-Mail-Adresse über den Link in der Bestätigungs-E-Mail.</p>
            <button
              @click="resendVerificationEmail"
              :disabled="isLoading || resendCooldown > 0"
              class="text-amber-800 dark:text-amber-200 underline hover:no-underline font-medium disabled:opacity-50"
            >
              {{ resendCooldown > 0 ? `Erneut senden in ${resendCooldown}s` : 'Bestätigungs-E-Mail erneut senden' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Registration Success Message -->
      <div v-if="showRegistrationSuccess" class="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div class="flex items-start space-x-3">
          <Icon name="info" class="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-green-700 dark:text-green-300">
            <p class="font-medium mb-1">Registrierung erfolgreich!</p>
            <p>Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.</p>
          </div>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Input -->
        <div class="space-y-2">
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            E-Mail
          </label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            placeholder="ihre.email@beispiel.de"
            :class="[
              'w-full px-4 py-3 rounded-lg border transition-all duration-200',
              'bg-white dark:bg-gray-800/50 backdrop-blur-sm',
              'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              emailError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            ]"
            :disabled="isLoading"
          />
        </div>

        <!-- Password Input -->
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Passwort
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="current-password"
              placeholder="Ihr Passwort"
              :class="[
                'w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200',
                'bg-white dark:bg-gray-800/50 backdrop-blur-sm',
                'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                passwordError ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              ]"
              :disabled="isLoading"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              :disabled="isLoading"
            >
              <Icon :name="showPassword ? 'eye-slash' : 'eye'" class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p class="text-sm text-red-700 dark:text-red-400 flex items-center">
            <Icon name="exclamation-triangle" class="w-4 h-4 mr-2 flex-shrink-0" />
            {{ errorMessage }}
          </p>
        </div>

        <!-- Action Buttons -->
        <div class="space-y-3 pt-2">
          <!-- Login Button -->
          <Button
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :disabled="isLoading || !isFormValid"
            :class="{ 'opacity-75': isLoading }"
          >
            <template v-if="isLoading && currentAction === 'login'" #icon-left>
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </template>
            {{ isLoading && currentAction === 'login' ? 'Anmeldung läuft...' : 'Anmelden' }}
          </Button>

          <!-- Register Button -->
          <Button
            type="button"
            @click="handleRegister"
            variant="secondary"
            size="lg"
            full-width
            :disabled="isLoading || !isFormValid"
            :class="{ 'opacity-75': isLoading }"
          >
            <template v-if="isLoading && currentAction === 'register'" #icon-left>
              <div class="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
            </template>
            {{ isLoading && currentAction === 'register' ? 'Registrierung läuft...' : 'Registrieren' }}
          </Button>
        </div>
      </form>

      <!-- Footer -->
      <div class="text-center text-sm text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p>Sicher und verschlüsselt mit Firebase</p>
        <p class="mt-1">📧 E-Mail-Bestätigung erforderlich für neue Accounts</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from '../ui/Button.vue'
import Icon from '../ui/Icon.vue'
import firebaseAuth, { type AuthError } from '../../services/firebase'

// Props & Emits
const emit = defineEmits<{
  loginSuccess: [user: any]
  registerSuccess: [user: any]
}>()

// Reactive data
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const currentAction = ref<'login' | 'register' | null>(null)
const showEmailVerificationWarning = ref(false)
const showRegistrationSuccess = ref(false)
const resendCooldown = ref(0)

// Computed properties
const isFormValid = computed(() => {
  return email.value.trim() !== '' && 
         password.value.length >= 6 && 
         email.value.includes('@')
})

const emailError = computed(() => {
  return errorMessage.value.includes('E-Mail') || errorMessage.value.includes('email')
})

const passwordError = computed(() => {
  return errorMessage.value.includes('Passwort') || errorMessage.value.includes('password')
})

// Methods
const clearError = () => {
  errorMessage.value = ''
  showEmailVerificationWarning.value = false
  showRegistrationSuccess.value = false
}

const handleSubmit = async () => {
  if (!isFormValid.value || isLoading.value) return
  
  clearError()
  isLoading.value = true
  currentAction.value = 'login'
  
  try {
    const user = await firebaseAuth.signIn(email.value.trim(), password.value)
    emit('loginSuccess', user)
  } catch (error) {
    const authError = error as AuthError
    if (authError.code === 'auth/email-not-verified') {
      showEmailVerificationWarning.value = true
    } else {
      errorMessage.value = authError.message
    }
  } finally {
    isLoading.value = false
    currentAction.value = null
  }
}

const handleRegister = async () => {
  if (!isFormValid.value || isLoading.value) return
  
  clearError()
  isLoading.value = true
  currentAction.value = 'register'
  
  try {
    await firebaseAuth.signUp(email.value.trim(), password.value)
    showRegistrationSuccess.value = true
    // Don't emit registerSuccess immediately - user needs to verify email first
  } catch (error) {
    const authError = error as AuthError
    errorMessage.value = authError.message
  } finally {
    isLoading.value = false
    currentAction.value = null
  }
}

const resendVerificationEmail = async () => {
  if (resendCooldown.value > 0) return
  
  try {
    await firebaseAuth.sendEmailVerification()
    
    // Start cooldown timer
    resendCooldown.value = 60
    const timer = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
    
  } catch (error) {
    const authError = error as AuthError
    errorMessage.value = authError.message
  }
}

// Clear error when user starts typing
const watchFormChanges = () => {
  if (errorMessage.value || showEmailVerificationWarning.value) {
    clearError()
  }
}

// Watch form changes
import { watch } from 'vue'
watch([email, password], watchFormChanges)
</script>

<style scoped>
/* Additional custom styles if needed */
.card {
  /* Ensure card styling is applied correctly */
  @apply bg-white dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg 
         border border-gray-200/50 dark:border-white/5 overflow-hidden;
}

/* Loading animation for buttons */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style> 