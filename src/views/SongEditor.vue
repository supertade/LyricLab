<script setup>
import { computed } from 'vue'
import { useFileManager } from '../stores/fileManager'
import LyricEditor from '../components/lyrics/LyricEditor.vue'
import FloatingAddBlockButton from '../components/ui/FloatingAddBlockButton.vue'

const props = defineProps({
  isModalOpen: {
    type: Boolean,
    default: false
  }
})

const fileManager = useFileManager()

// Computed properties from store
const currentSong = computed(() => fileManager.currentSong)

// Methods
const addNewSection = (type) => {
  fileManager.addSection(type)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <LyricEditor 
      v-if="currentSong" 
      :song="currentSong"
    />
    
    <!-- Floating Action Button for adding new blocks -->
    <FloatingAddBlockButton 
      v-if="currentSong && !isModalOpen"
      @add-block="addNewSection"
    />
  </div>
</template> 