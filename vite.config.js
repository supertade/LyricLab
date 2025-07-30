import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  build: {
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'utils': [
            './src/utils/formatters.ts'
          ],
          'microsoft': [
            '@azure/msal-browser'
          ],
          'ui-components': [
            './src/components/ui/AppConfirmDialog.vue',
            './src/components/ui/Button.vue',
            './src/components/ui/ConfirmDialog.vue',
            './src/components/ui/FloatingAddBlockButton.vue',
            './src/components/ui/Icon.vue',
            './src/components/ui/SplashScreen.vue'
          ],
          'media-components': [
            './src/components/media/AudioRecorder.vue',
            './src/components/media/PlaybackControls.vue',
            './src/components/media/RecordButton.vue',
            './src/components/media/RecordingProgress.vue'
          ],
          'lyrics-components': [
            './src/components/lyrics/LyricEditor.vue',
            './src/components/lyrics/LyricLine.vue',
            './src/components/lyrics/LyricSection.vue',
            './src/components/lyrics/NoteBlock.vue',
            './src/components/lyrics/SectionTypesBar.vue'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'pinia', '@azure/msal-browser']
  }
})
