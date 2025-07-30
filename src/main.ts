import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { SafeArea } from '@capacitor-community/safe-area'
import { StatusBar } from '@capacitor/status-bar'
import { Capacitor } from '@capacitor/core'
import { error as logError } from './utils/logger'

// Import global components
import AppConfirmDialog from './components/ui/AppConfirmDialog.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Register global components
app.component('AppConfirmDialog', AppConfirmDialog)

// Initialize the app when the device is ready
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Only run StatusBar and SafeArea code on native platforms
    if (Capacitor.isNativePlatform()) {
      // Make StatusBar transparent
      await StatusBar.setOverlaysWebView({ overlay: true })
      
      // Enable SafeArea plugin with transparent status bar
      await SafeArea.enable({
        config: {
          customColorsForSystemBars: true,
          statusBarColor: '#00000000', // transparent
          statusBarContent: 'light',
          navigationBarColor: '#00000000', // transparent
          navigationBarContent: 'light',
        }
      })
    }
  } catch (err) {
    logError('Error initializing SafeArea or StatusBar:', err)
  }
  
  app.mount('#app')
})

// Handle mobile back button
document.addEventListener('ionBackButton', ((ev: Event) => {
  const customEvent = ev as CustomEvent<{ register: (priority: number, handler: () => void) => void }>
  customEvent.detail.register(10, () => {
    // Handle custom back button behavior if needed
    if (window.history.length > 1) {
      window.history.back()
    }
  })
}) as EventListener) 