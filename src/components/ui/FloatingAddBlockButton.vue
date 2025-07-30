<template>
  <div>
    <!-- Backdrop overlay when menu is open -->
    <transition name="backdrop">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-40 backdrop-blur-sm bg-black/5 dark:bg-black/20"
        @click="closeMenu"
      ></div>
    </transition>
    
    <!-- Floating Action Button -->
    <button
      @click="toggleMenu"
      class="fixed bottom-6 right-6 bg-blue-500 dark:bg-blue-500 text-white p-4 rounded-full shadow-lg hover:scale-105 transition-all z-50 flex items-center justify-center"
      :class="{ 'pulse-animation': showPulse }"
      aria-label="Add Block"
    >
      <span 
        class="transition-transform duration-300"
        :class="{ 'rotate-45': isOpen }"
      >
        <Icon name="plus" :size="24" />
      </span>
    </button>
    
    <!-- Menu Items -->
    <transition name="menu">
      <div 
        v-if="isOpen" 
        class="fixed bottom-24 right-6 z-50 flex flex-col-reverse gap-3 items-end"
      >
        <div class="rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700/50 menu-container">
          <div class="flex flex-col gap-1 min-w-[180px]">
            <transition-group
              name="stagger"
              tag="ul"
              class="w-full"
            >
              <li
                v-for="(type, index) in sectionTypes"
                :key="type.value"
                :style="{ 
                  transitionDelay: `${index * 60}ms`,
                  animationDelay: `${index * 60}ms` 
                }"
                class="w-full menu-item"
              >
                <button
                  @click="addBlock(type.value)"
                  class="text-left w-full px-4 py-3 transition-all flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-blue-900/40"
                >
                  <Icon 
                    :name="getSectionIcon(type.value)" 
                    :size="18" 
                    class="text-blue-600 dark:text-blue-400 flex-shrink-0" 
                  />
                  <span>{{ type.label }}</span>
                </button>
              </li>
            </transition-group>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { SECTION_TYPES } from '../../config/constants'
import Icon from './Icon.vue'

// Props and emits
const emit = defineEmits(['add-block'])

// State
const isOpen = ref(false)
const showPulse = ref(false)

// Methods
const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

const closeMenu = () => {
  isOpen.value = false
}

const addBlock = (type) => {
  emit('add-block', type)
  closeMenu()
}

// Map section types to appropriate icons
const getSectionIcon = (type) => {
  const iconMap = {
    'verse': 'document',
    'chorus': 'song',
    'bridge': 'song',
    'pre-chorus': 'song',
    'intro': 'song',
    'outro': 'song',
    'note': 'note'
  }
  return iconMap[type] || 'document'
}

// Add initial pulse animation
onMounted(() => {
  // Delay pulse animation to make it noticeable after page loads
  setTimeout(() => {
    showPulse.value = true
    
    // Remove pulse after it plays
    setTimeout(() => {
      showPulse.value = false
    }, 2000)
  }, 1000)
})

// Make section types available to template
const sectionTypes = SECTION_TYPES
</script>

<style scoped>
/* Menu container styling */
.menu-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
}

.dark .menu-container {
  background: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(12px);
}

/* Backdrop animation */
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.5s ease, backdrop-filter 0.5s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
  backdrop-filter: blur(0);
}

.backdrop-enter-to,
.backdrop-leave-from {
  opacity: 1;
  backdrop-filter: blur(4px);
}

/* Menu animation */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.33, 1, 0.68, 1);
  transform-origin: bottom right;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

/* Staggered items animation */
.stagger-enter-active {
  animation: menu-item-in 0.5s cubic-bezier(0.2, 0.9, 0.4, 1) forwards;
}

.stagger-leave-active {
  animation: menu-item-out 0.3s ease forwards;
  position: absolute;
}

.stagger-enter-from,
.stagger-leave-to {
  opacity: 0;
}

@keyframes menu-item-in {
  0% {
    opacity: 0;
    transform: translateX(30px);
  }
  60% {
    opacity: 1;
    transform: translateX(-5px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes menu-item-out {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(20px);
  }
}

/* Menu item hover effect */
.menu-item {
  position: relative;
  overflow: hidden;
}

.menu-item button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%);
  transform: translate(-50%, -50%) scale(0);
  opacity: 0;
  transition: transform 0.4s ease, opacity 0.4s ease;
  pointer-events: none;
  border-radius: 4px;
}

.menu-item button:hover::before {
  transform: translate(-50%, -50%) scale(2.5);
  opacity: 1;
}

/* Pulse animation for FAB */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}

.pulse-animation {
  animation: pulse 1.5s ease-in-out infinite;
}

.dark .pulse-animation {
  animation: pulse-dark 1.5s ease-in-out infinite;
}

@keyframes pulse-dark {
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
}
</style> 