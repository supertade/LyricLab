import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '../stores/user'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

// Using dynamic imports for all routes - this enables code splitting
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: false } // Public page
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: false } // Allow access to settings for login
  },
  {
    path: '/settings/account',
    name: 'AccountSettings',
    component: () => import('../views/AccountSettings.vue'),
    meta: { requiresAuth: true } // Protected - requires login for account management
  },
  {
    path: '/settings/cloud-sync',
    name: 'CloudSyncSettings',
    component: () => import('../views/CloudSyncSettings.vue'),
    meta: { requiresAuth: false } // Allow access to see cloud sync info even without login
  },
  {
    path: '/editor',
    name: 'SongEditor',
    component: () => import('../views/SongEditor.vue'),
    meta: { requiresAuth: true } // Protected - requires login for cloud sync
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false, redirectIfAuthenticated: true } // Redirect to home if already logged in
  },
  {
    path: '/collaborate/:sessionId',
    name: 'Collaborate',
    component: () => import('../views/CollaborateView.vue'),
    meta: { requiresAuth: true } // Protected - requires login for collaboration
  },
  {
    path: '/collaborate/:sessionId/manage',
    name: 'CollaborateManage',
    component: () => import('../views/CollaborationManageView.vue'),
    meta: { requiresAuth: true } // Protected - requires login for collaboration management
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  // Wait for auth to be initialized
  if (!userStore.isAuthInitialized) {
    // Wait a bit for Firebase auth to initialize
    const unsubscribe = userStore.$subscribe(() => {
      if (userStore.isAuthInitialized) {
        unsubscribe()
        // Re-run the navigation guard
        router.push(to.fullPath)
      }
    })
    return
  }
  
  // If route requires authentication and user is not authenticated
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    auth('🔒 Zugriff verweigert - Login erforderlich',2509)
    next({
      name: 'Login',
      query: { redirect: to.fullPath } // Save intended destination
    })
    return
  }
  
  // If user is authenticated and tries to access login page
  if (to.meta.redirectIfAuthenticated && userStore.isAuthenticated) {
    debug('🚀 Bereits angemeldet - Weiterleitung zur Startseite',2827)
    next({ name: 'Home' })
    return
  }
  
  // Allow navigation
  next()
})

export default router 