<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import { useFileManager } from '../stores/fileManager'
import SongEditor from './SongEditor.vue'
import EmptyState from '../components/layout/EmptyState.vue'
import AppHeader from '../components/layout/AppHeader.vue'
import Button from '../components/ui/Button.vue'
import Icon from '../components/ui/Icon.vue'
import { useAppConfirm } from '../composables/useAppConfirm'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

/**
 * Component props
 */
const props = defineProps({
  isDarkMode: Boolean
})

const emit = defineEmits(['toggle-dark-mode'])

const fileManager = useFileManager()
const { confirmDelete } = useAppConfirm()
const showSongList = ref(false)
const isTransitioning = ref(false)
const isModalOpen = ref(false)

// Dynamically import large components
const SongListModal = defineAsyncComponent(() => 
  import('../components/layout/SongListModal.vue')
)
const SectionTypesBar = defineAsyncComponent(() => 
  import('../components/lyrics/SectionTypesBar.vue')
)
const LyricEditor = defineAsyncComponent(() => 
  import('../components/lyrics/LyricEditor.vue')
)

/**
 * Current song from the file manager store
 */
const currentSong = computed(() => fileManager.currentSong)

/**
 * Creates a new song and hides the song list
 */
const handleNewSong = async () => {
  try {
    isTransitioning.value = true
    sync('🎵 Creating new song with auto-sync from Home...',1361)
    await fileManager.createNewSong()
    showSongList.value = false
    debug('✅ New song created successfully from Home',1498)
  } catch (error) {
    error('❌ Failed to create new song from Home:', error)
  } finally {
    setTimeout(() => {
      isTransitioning.value = false
    }, 300)
  }
}

/**
 * Toggles the song list modal visibility
 */
const toggleShowSongList = () => {
  showSongList.value = !showSongList.value
}

/**
 * Toggles dark mode and emits the event to parent
 */
const toggleDarkMode = () => {
  emit('toggle-dark-mode')
}

/**
 * Deletes the current song after confirmation
 */
const handleDeleteCurrentSong = async () => {
  if (currentSong.value) {
    const confirmed = await confirmDelete({
      title: 'Delete Song',
      itemName: currentSong.value.title,
      onConfirm: async () => {
        try {
          isTransitioning.value = true
          sync('🗑️ Deleting current song with auto-sync:', currentSong.value.title)
          await fileManager.deleteCurrentSong()
          sync('✅ Current song deleted successfully from local and cloud',2445)
        } catch (error) {
          error('❌ Failed to delete current song:', error)
        } finally {
          setTimeout(() => {
            isTransitioning.value = false
          }, 300)
        }
      }
    })
  }
}

/**
 * Adds a new section of the specified type to the current song
 */
const addNewSection = (type) => {
  fileManager.addSection(type)
}

/**
 * Handle modal state changes from header
 */
const handleModalStateChange = (isOpen) => {
  isModalOpen.value = isOpen
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full">
    <AppHeader 
      :is-dark-mode="isDarkMode" 
      @toggle-dark-mode="toggleDarkMode" 
      @toggle-song-list="toggleShowSongList"
      @delete-current-song="handleDeleteCurrentSong"
      @modal-state-changed="handleModalStateChange"
    />

    <div class="flex-1 overflow-y-auto relative" :class="{ 'transition-opacity duration-300 ease-in-out': isTransitioning, 'opacity-50': isTransitioning }">
      <!-- Empty State with Audio Recording Explanation -->
      <transition name="fade" mode="out-in">
        <EmptyState
          v-if="currentSong && !currentSong.sections.length"
          title="Start your song"
          description="Add sections and write your lyrics. You can now also record melody ideas directly and attach them to each section."
          :is-dark-mode="isDarkMode"
        >
          <template #actions>
            <div class="flex flex-wrap gap-3 justify-center">
              <Button @click="addNewSection('verse')" variant="primary">
                Add Verse
              </Button>
              <Button @click="addNewSection('chorus')" variant="secondary">
                Add Chorus
              </Button>
            </div>
          </template>
        </EmptyState>

        <SongEditor 
          v-else-if="currentSong && currentSong.sections.length"
          :is-modal-open="isModalOpen || showSongList"
        />

        <EmptyState
          v-else
          icon="document"
          title="No song selected"
          description="Select an existing song or create a new one."
          :is-dark-mode="isDarkMode"
        >
          <template #actions>
            <div class="flex flex-wrap gap-3 justify-center">
              <Button @click="toggleShowSongList" variant="primary">
                Select a song
              </Button>
              <Button @click="handleNewSong" variant="secondary">
                Create new song
              </Button>
            </div>
          </template>
        </EmptyState>
      </transition>
    </div>

    <!-- Song List Modal with transition -->
    <SongListModal 
      :visible="showSongList"
      @close="showSongList = false"
    />
  </div>
</template> 