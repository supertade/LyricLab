import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import firebaseAuth, { type AuthUser } from '../services/firebase'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

export const useUserStore = defineStore('user', () => {
  // State
  const currentUser = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const isAuthInitialized = ref(false)

  // Getters
  const isAuthenticated = computed(() => currentUser.value !== null)
  const userEmail = computed(() => currentUser.value?.email || null)
  const userId = computed(() => currentUser.value?.uid || null)

  // Actions
  const setUser = (user: AuthUser | null) => {
    const previousUser = currentUser.value
    currentUser.value = user
    
    // Optional: Persist to localStorage for offline access
    if (user) {
      localStorage.setItem('lyriclab_user', JSON.stringify(user))
      
      // Auto-enable cloud sync when user logs in
      if (!previousUser || previousUser.uid !== user.uid) {
        sync('🔄 User logged in, enabling cloud sync...',947)
        // Note: fileManager will be initialized after this store
        // Cloud sync will be enabled via App.vue or after fileManager initialization
      }
    } else {
      localStorage.removeItem('lyriclab_user')
      
      // Auto-disable cloud sync when user logs out
      if (previousUser) {
        sync('🔄 User logged out, disabling cloud sync...',1317)
        // Note: fileManager will handle cloud sync disable
      }
    }
  }

  const login = async (email: string, password: string): Promise<AuthUser> => {
    isLoading.value = true
    try {
      const user = await firebaseAuth.signIn(email, password)
      setUser(user)
      return user
    } finally {
      isLoading.value = false
    }
  }

  const register = async (email: string, password: string): Promise<AuthUser> => {
    isLoading.value = true
    try {
      const user = await firebaseAuth.signUp(email, password)
      setUser(user)
      return user
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (): Promise<void> => {
    isLoading.value = true
    try {
      await firebaseAuth.signOut()
      setUser(null)
    } finally {
      isLoading.value = false
    }
  }

  const initializeAuth = () => {
    // Don't load from localStorage immediately - wait for Firebase auth state
    // This prevents showing login UI when Firebase isn't actually connected
    auth('🔄 Initializing Firebase Auth - waiting for auth state...')

    // Listen to Firebase auth state changes
    const setupAuthListener = async () => {
      try {
        return await firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
          if (firebaseUser) {
            // Use the safe reloadUser function instead of direct reload
            try {
              await firebaseAuth.reloadUser()
            } catch (error) {
              auth('Failed to reload user:', error)
            }
            
            const user: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              emailVerified: firebaseUser.emailVerified
            }
            
            // If email was just verified, log this important event
            const previousUser = currentUser.value
            if (firebaseUser.emailVerified && previousUser && !previousUser.emailVerified) {
              auth('✅ Email verification status updated - user is now verified!')
            }
            
            auth('🔥 Firebase Auth confirmed - user is authenticated')
            setUser(user)
          } else {
            // Try to restore from localStorage if Firebase says no user but we have stored data
            const storedUser = localStorage.getItem('lyriclab_user')
            if (storedUser) {
              try {
                const user = JSON.parse(storedUser) as AuthUser
                auth('⚠️ No Firebase user, but found stored user - attempting silent login...')
                // Don't set user immediately, let Firebase auth handle it
                // This prevents the "fake logged in" state
              } catch (error) {
                auth('Failed to parse stored user data:', error)
                localStorage.removeItem('lyriclab_user')
              }
            } else {
              auth('🔓 No authenticated user found')
            }
            setUser(null)
          }
          
          if (!isAuthInitialized.value) {
            isAuthInitialized.value = true
          }
        })
      } catch (error) {
        auth('Failed to setup auth listener:', error)
        isAuthInitialized.value = true
      }
    }

    // Setup listener asynchronously
    setupAuthListener()
  }

  const clearAuthData = () => {
    currentUser.value = null
    localStorage.removeItem('lyriclab_user')
  }

  // Manual function to refresh verification status
  const refreshVerificationStatus = async (): Promise<boolean> => {
    try {
      const isVerified = await firebaseAuth.reloadUser()
      
      if (isVerified && currentUser.value) {
        auth('🔄 Manual verification refresh: User is verified!')
        setUser({
          ...currentUser.value,
          emailVerified: true
        })
      }
      
      return isVerified
    } catch (error) {
      auth('❌ Failed to refresh verification status:', error)
      return false
    }
  }

  // Handle state mismatch between localStorage and Firebase
  const handleAuthStateMismatch = async () => {
    try {
      auth('🔍 Checking for auth state mismatch...')
      const firebaseUser = await firebaseAuth.getCurrentUser()
      
      if (!firebaseUser && currentUser.value) {
        // We have localStorage data but no Firebase user - clear the mismatch
        auth('⚠️ Auth state mismatch detected: localStorage has user but Firebase does not')
        auth('🧹 Clearing cached auth data...')
        setUser(null)
        return false
      } else if (firebaseUser && !currentUser.value) {
        // Firebase has user but localStorage doesn't - sync it
        auth('🔄 Syncing Firebase user to local state...')
        const user: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          emailVerified: firebaseUser.emailVerified
        }
        setUser(user)
        return true
      }
      
      return !!firebaseUser
    } catch (error) {
      auth('❌ Error checking auth state:', error)
      // Clear any cached data on error
      setUser(null)
      return false
    }
  }

  return {
    // State
    currentUser,
    isLoading,
    isAuthInitialized,
    
    // Getters
    isAuthenticated,
    userEmail,
    userId,
    
    // Actions
    setUser,
    login,
    register,
    logout,
    initializeAuth,
    clearAuthData,
    refreshVerificationStatus,
    handleAuthStateMismatch
  }
}) 