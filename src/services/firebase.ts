// Platform-Aware Firebase Service
import { Capacitor } from '@capacitor/core'

// Platform detection
const isNative = Capacitor.isNativePlatform()
const isWeb = Capacitor.getPlatform() === 'web'

// Auth service interface
export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
  emailVerified: boolean
}

export interface AuthError {
  code: string
  message: string
}

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhjoeehIElqD20-cZAeUF9DanIlISVOqU",
  authDomain: "lyriclab-a6ec8.firebaseapp.com",
  projectId: "lyriclab-a6ec8",
  storageBucket: "lyriclab-a6ec8.appspot.com",
  messagingSenderId: "670803502989",
  appId: "1:670803502989:web:43f3f50cf9ed26633b7fc4"
}

// Platform-specific implementations
let nativeAuth: any = null
let nativeFirestore: any = null
let webAuth: any = null
let webDb: any = null
let initializationPromise: Promise<void> | null = null

// Helper function to get readable error messages
export const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'Kein Benutzer mit dieser E-Mail gefunden.'
    case 'auth/wrong-password':
      return 'Falsches Passwort.'
    case 'auth/email-already-in-use':
      return 'Diese E-Mail-Adresse ist bereits registriert.'
    case 'auth/weak-password':
      return 'Das Passwort ist zu schwach. Mindestens 6 Zeichen erforderlich.'
    case 'auth/invalid-email':
      return 'Ungültige E-Mail-Adresse.'
    case 'auth/too-many-requests':
      return 'Zu viele Versuche. Bitte versuchen Sie es später erneut.'
    case 'auth/network-request-failed':
      return 'Netzwerkfehler. Bitte prüfen Sie Ihre Internetverbindung.'
    case 'auth/invalid-credential':
      return 'Ungültige Anmeldedaten.'
    case 'auth/user-disabled':
      return 'Dieser Account wurde deaktiviert.'
    case 'auth/email-not-verified':
      return 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse über den Link in der Bestätigungs-E-Mail.'
    default:
      return 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.'
  }
}

// Initialize platform-specific Firebase (lazy loading)
const initializePlatformFirebase = async (): Promise<void> => {
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    if (isNative) {
      console.log('🔥 Initializing native Firebase...')
      try {
        // Import native plugins
        const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication')
        const { FirebaseFirestore } = await import('@capacitor-firebase/firestore')
        
        nativeAuth = FirebaseAuthentication
        nativeFirestore = FirebaseFirestore
        
        console.log('✅ Native Firebase plugins loaded')
      } catch (error) {
        console.error('❌ Failed to load native Firebase plugins:', error)
        throw new Error('Native Firebase plugins not available')
      }
    } else {
      console.log('🌐 Initializing web Firebase...')
      // Import web Firebase
      const { initializeApp } = await import('firebase/app')
      const { getAuth } = await import('firebase/auth')
      const { getFirestore } = await import('firebase/firestore')
      
      const app = initializeApp(firebaseConfig)
      webAuth = getAuth(app)
      webDb = getFirestore(app)
      
      console.log('✅ Web Firebase initialized')
    }
  })()

  return initializationPromise
}

// Ensure Firebase is initialized before any operation
const ensureInitialized = async (): Promise<void> => {
  if (!nativeAuth && !webAuth && !initializationPromise) {
    await initializePlatformFirebase()
  } else if (initializationPromise) {
    await initializationPromise
  }
}

/**
 * Retry wrapper for operations with exponential backoff
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Check if it's a connection error
      const isConnectionError = 
        error?.code === 'unavailable' ||
        error?.code === 'permission-denied' ||
        error?.message?.includes('client is offline') ||
        error?.message?.includes('Failed to get document') ||
        error?.message?.includes('transport error')
      
      if (isConnectionError && attempt < maxRetries) {
        // Wait with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // If not a connection error or max retries reached, throw
      break
    }
  }
  
  throw lastError
}

/**
 * Get platform-aware Auth instance
 */
export const getAuth = async () => {
  await ensureInitialized()
  if (isNative) {
    return nativeAuth
  } else {
    return webAuth
  }
}

/**
 * Get platform-aware Firestore instance  
 */
export const getFirestore = async () => {
  try {
    await ensureInitialized()
    if (isNative) {
      if (!nativeFirestore) {
        throw new Error('Native Firestore not available')
      }
      return nativeFirestore
    } else {
      if (!webDb) {
        throw new Error('Web Firestore not available')
      }
      return webDb
    }
  } catch (error) {
    console.error('Failed to get Firestore instance:', error)
    throw error
  }
}

/**
 * Get current user in a platform-aware way
 */
export const getCurrentUser = async () => {
  try {
    await ensureInitialized()
    if (isNative && nativeAuth) {
      try {
        const result = await nativeAuth.getCurrentUser()
        return result?.user || null
      } catch (error) {
        console.warn('Failed to get current user from native auth:', error)
        return null
      }
    } else if (isWeb && webAuth) {
      return webAuth.currentUser
    }
    return null
  } catch (error) {
    console.warn('Failed to get current user:', error)
    return null
  }
}

// Authentication functions
export const firebaseAuth = {
  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    await ensureInitialized()
    
    try {
      if (isNative && nativeAuth) {
        console.log('🔥 Native sign in...')
        const result = await nativeAuth.signInWithEmailAndPassword({
          email,
          password
        })
        
        return {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || null,
          emailVerified: result.user.emailVerified
        }
      } else if (isWeb && webAuth) {
        console.log('🌐 Web sign in...')
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        const userCredential = await signInWithEmailAndPassword(webAuth, email, password)
        const user = userCredential.user
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      } else {
        throw new Error('Firebase not initialized')
      }
    } catch (error: any) {
      throw {
        code: error.code,
        message: getAuthErrorMessage(error.code)
      } as AuthError
    }
  },

  // Create user with email and password
  async signUp(email: string, password: string): Promise<AuthUser> {
    await ensureInitialized()
    
    try {
      if (isNative && nativeAuth) {
        console.log('🔥 Native sign up...')
        const result = await nativeAuth.createUserWithEmailAndPassword({
          email,
          password
        })
        
        // Send email verification
        await nativeAuth.sendEmailVerification()
        
        return {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || null,
          emailVerified: result.user.emailVerified
        }
      } else if (isWeb && webAuth) {
        console.log('🌐 Web sign up...')
        const { createUserWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth')
        const userCredential = await createUserWithEmailAndPassword(webAuth, email, password)
        const user = userCredential.user
        
        // Send email verification
        await sendEmailVerification(user)
        
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: user.emailVerified
        }
      } else {
        throw new Error('Firebase not initialized')
      }
    } catch (error: any) {
      throw {
        code: error.code,
        message: getAuthErrorMessage(error.code)
      } as AuthError
    }
  },

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    await ensureInitialized()
    
    try {
      if (isNative && nativeAuth) {
        await nativeAuth.sendEmailVerification()
      } else if (isWeb && webAuth) {
        const { sendEmailVerification } = await import('firebase/auth')
        const user = webAuth.currentUser
        if (!user) {
          throw new Error('Kein Benutzer angemeldet')
        }
        await sendEmailVerification(user)
      }
    } catch (error: any) {
      throw {
        code: error.code || 'auth/unknown-error',
        message: error.message || 'Fehler beim Senden der Bestätigungs-E-Mail'
      } as AuthError
    }
  },

  // Check if current user's email is verified
  async isEmailVerified(): Promise<boolean> {
    const user = await getCurrentUser()
    return user?.emailVerified || false
  },

  // Reload current user to get fresh verification status
  async reloadUser(): Promise<boolean> {
    await ensureInitialized()
    
    try {
      if (isNative && nativeAuth) {
        // Native Auth: Token-Refresh erzwingen, sonst bleibt emailVerified gecached
        try {
          await nativeAuth.getIdToken({ forceRefresh: true })
        } catch (tokenErr) {
          console.warn('Token refresh failed (native):', tokenErr)
        }

        const refreshed = await nativeAuth.getCurrentUser()
        return refreshed?.user?.emailVerified || refreshed?.emailVerified || false
      } else if (isWeb && webAuth) {
        const user = webAuth.currentUser
        if (!user) return false
        
        await user.reload()
        return user.emailVerified
      }
      return false
    } catch (error) {
      console.warn('Failed to reload user:', error)
      return false
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    await ensureInitialized()
    
    try {
      if (isNative && nativeAuth) {
        await nativeAuth.signOut()
      } else if (isWeb && webAuth) {
        const { signOut } = await import('firebase/auth')
        await signOut(webAuth)
      }
    } catch (error: any) {
      throw {
        code: error.code,
        message: getAuthErrorMessage(error.code)
      } as AuthError
    }
  },

  // Get current user
  getCurrentUser,

  // Listen to auth state changes
  async onAuthStateChanged(callback: (user: any) => void) {
    await ensureInitialized()
    
    if (isNative && nativeAuth) {
      return nativeAuth.addListener('authStateChange', callback)
    } else if (isWeb && webAuth) {
      const { onAuthStateChanged } = await import('firebase/auth')
      return onAuthStateChanged(webAuth, callback)
    }
    return () => {}
  }
}

// Export compatibility auth and db references (will be properly initialized)
export const auth = isWeb ? webAuth : null
export const db = isWeb ? webDb : null

export default firebaseAuth 