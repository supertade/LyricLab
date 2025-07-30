<template>
  <div class="login-view">
    <LoginForm 
      @loginSuccess="handleLoginSuccess"
      @registerSuccess="handleRegisterSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import LoginForm from '../components/auth/LoginForm.vue'
import type { AuthUser } from '../services/firebase'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// Get redirect URL from query params
const redirectPath = (route.query.redirect as string) || '/'

// Handle successful login
const handleLoginSuccess = (user: AuthUser) => {
  auth('Login erfolgreich:', user)
  userStore.setUser(user)
  debug('🚀 Weiterleitung zu:', redirectPath)
  router.push(redirectPath)
}

// Handle successful registration
const handleRegisterSuccess = (user: AuthUser) => {
  debug('Registrierung erfolgreich:', user)
  userStore.setUser(user)
  debug('🚀 Weiterleitung zu:', redirectPath)
  router.push(redirectPath)
}
</script>

<style scoped>
.login-view {
  /* Full height container */
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
}
</style> 