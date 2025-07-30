import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { SECTION_TYPES } from '../config/constants'
import { cloudStorage, type CloudSyncResult } from '../services/cloudStorage'
import { useUserStore } from './user'
import { debug, info, warn, error, collaboration, storage, audio, auth, sync } from '@/utils/logger'

export interface RecordingMetadata {
  duration?: number;
  timestamp?: string;
  name?: string;
}

export interface Recording {
  id: string | number;
  data: string;
  timestamp: string;
  duration: number;
}

export interface CollaborationInfo {
  authorId: string;
  authorColor: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
}

export interface Line {
  id: string | number;
  text: string;
  syllables: number;
  // Collaboration authorship information
  authorId?: string; // ID of the user who created this line
  authorColor?: string; // Color of the author
  lastModifiedBy?: string; // ID of the user who last modified this line
  lastModifiedAt?: string; // Timestamp of last modification
}

export interface Section {
  id: string | number;
  title: string;
  type: string;
  lines: Line[];
  recording: Recording | null;
  content?: string; // For note type sections
  // Collaboration authorship information for note sections
  authorId?: string; // ID of the user who created this section
  authorColor?: string; // Color of the author
  lastModifiedBy?: string; // ID of the user who last modified this section
  lastModifiedAt?: string; // Timestamp of last modification
}

export interface Song {
  id: string | number;
  title: string;
  artist?: string;
  bpm?: string;
  key?: string;
  sections: Section[];
  recording?: Recording | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Store zum Verwalten der Songtexte, deren Speicherung und Synchronisierung
 */
export const useFileManager = defineStore('fileManager', () => {
  const songs = ref<Song[]>([])
  const currentSongId = ref<string | number | null>(null)
  const userStore = useUserStore()
  
  // Cloud sync state
  const cloudSyncEnabled = ref<boolean>(false)
  const cloudSyncStatus = ref<'idle' | 'syncing' | 'error' | 'success'>('idle')
  const cloudSyncError = ref<string | null>(null)
  const lastCloudSyncTime = ref<string | null>(null)
  const cloudSongsCount = ref<number>(0)

  /**
   * Der aktuell ausgewählte Song
   */
  const currentSong = computed<Song | undefined>(() => {
    return songs.value.find(song => song.id === currentSongId.value)
  })

  /**
   * Lädt Songs aus dem lokalen Speicher
   */
  const loadSongs = async (): Promise<void> => {
    storage('Loading songs...',1793)
    
    try {
      // Songs aus dem localStorage laden
      const savedSongs = localStorage.getItem('songs')
      if (savedSongs) {
        songs.value = JSON.parse(savedSongs)
        storage('Loaded songs from localStorage:', songs.value)
      }
    } catch (error) {
      storage('Error loading songs:', error)
    }
  }

  /**
   * Speichert Songs im lokalen Speicher
   */
  const saveSongs = async (): Promise<void> => {
    debug('Saving songs...',2262)
    
    try {
      // Songs im localStorage speichern
      localStorage.setItem('songs', JSON.stringify(songs.value))
      storage('Saved songs to localStorage',2420)
    } catch (error) {
      error('Error saving songs:', error)
    }
  }



  /**
   * Creates a new song and sets it as the current song
   * @returns The newly created song
   */
  const createNewSong = async (): Promise<Song> => {
    debug('Creating new song...',2702)
    
    // Generate unique title by checking existing songs
    let title = "New Song";
    const existingSongs = songs.value.filter(song => song.title.startsWith("New Song"));
    
    if (existingSongs.length > 0) {
      // Extract numbers from existing titles to find the next available number
      const numbers = existingSongs
        .map(song => {
          const match = song.title.match(/New Song(?:\s+(\d+))?$/);
          return match ? (match[1] ? parseInt(match[1], 10) : 1) : 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => a - b);
      
      // Find the first available number
      let nextNumber = 1;
      if (numbers.length > 0) {
        for (let i = 0; i < numbers.length; i++) {
          if (numbers[i] !== i + 1) {
            nextNumber = i + 1;
            break;
          }
          nextNumber = numbers[numbers.length - 1] + 1;
        }
      }
      
      // If there are songs with this title, add a number
      if (nextNumber > 1) {
        title = `New Song ${nextNumber}`;
      }
    }
    
    const newSong: Song = {
      id: Date.now(),
      title: title,
      sections: [
        {
          id: Date.now() + 1,
          type: 'verse',
          title: 'Verse',
          lines: [
            { id: Date.now() + 2, text: '', syllables: 0 },
            { id: Date.now() + 3, text: '', syllables: 0 },
            { id: Date.now() + 4, text: '', syllables: 0 },
            { id: Date.now() + 5, text: '', syllables: 0 }
          ],
          recording: null
        }
      ]
    }
    debug('New song created:', newSong)
    songs.value.push(newSong)
    currentSongId.value = newSong.id
    await saveSongs()
    
    // Auto-sync to cloud if enabled
    if (cloudSyncEnabled.value && userStore.userId) {
      try {
        sync('☁️ Auto-syncing new song to cloud:', newSong.title)
        await saveSongToCloud(newSong, userStore.userId)
        sync('✅ New song auto-synced successfully',4663)
      } catch (error) {
        sync('⚠️ Failed to auto-sync new song to cloud:', error)
        // Don't throw - local creation succeeded
      }
    }
    
    return newSong
  }

  /**
   * Sets the given song as the current song
   * @param song - The song to select or its ID
   */
  const selectSong = (song: Song | string | number): void => {
    if (typeof song === 'object') {
      debug('Selecting song:', song.id)
      currentSongId.value = song.id
    } else {
      debug('Selecting song by ID:', song)
      currentSongId.value = song
    }
  }

  /**
   * Deletes a song by its ID
   * @param id - The ID of the song to delete
   */
  const deleteSong = async (id: string | number): Promise<void> => {
    debug('🗑️ Deleting song:', id)
    const index = songs.value.findIndex(song => song.id === id)
    if (index !== -1) {
      const songToDelete = songs.value[index]
      
      // Delete locally first
      songs.value.splice(index, 1)
      if (currentSongId.value === id) {
        currentSongId.value = songs.value[0]?.id || null
      }
      await saveSongs()
      
      // Also delete from cloud if cloud sync is enabled
      if (cloudSyncEnabled.value && userStore.userId) {
        try {
          sync('☁️ Auto-deleting from cloud:', songToDelete.title)
          await deleteSongFromCloud(id.toString(), userStore.userId)
          sync('✅ Song deleted from cloud successfully',6084)
        } catch (error) {
          sync('⚠️ Failed to delete song from cloud:', error)
          // Don't throw - local deletion succeeded
        }
      }
    }
  }

  /**
   * Aktualisiert einen Song mit den neuen Daten
   * @param updatedSong - Der aktualisierte Song
   */
  const updateSong = async (updatedSong: Song): Promise<void> => {
    debug('📝 Updating song:', updatedSong.id, updatedSong.title)
    const index = songs.value.findIndex(song => song.id === updatedSong.id)
    if (index !== -1) {
      // Always update locally first (for immediate UI response)
      songs.value[index] = updatedSong
      await saveSongs()
      
      // Also save to cloud if cloud sync is enabled
      if (cloudSyncEnabled.value && userStore.userId) {
        try {
          sync('☁️ Auto-syncing to cloud:', updatedSong.title)
          await saveSongToCloud(updatedSong, userStore.userId)
          sync('✅ Auto-sync completed:', updatedSong.title)
        } catch (error) {
          sync('⚠️ Cloud sync failed (continuing with local):', error)
          // Don't throw error - local save already succeeded
        }
      }
    }
  }

  /**
   * Fügt einen neuen Abschnitt zum aktuellen Song hinzu
   * @param type - Der Typ des Abschnitts
   * @returns Der neu erstellte Abschnitt oder undefined bei Fehler
   */
  const addSection = (type: string = 'verse'): Section | undefined => {
    if (!currentSong.value) return undefined
    
    // Create Firebase-safe section (no undefined values)
    const section: Section = {
      id: Date.now(),
      type,
      title: generateSectionTitle(type, currentSong.value.sections),
      lines: type === 'note' ? [] : [], // Notes don't need lines, but keep empty array for compatibility
      recording: null
    }
    
    // Only add content field for note types (Firebase doesn't like undefined)
    if (type === 'note') {
      section.content = ''
    }
    
    currentSong.value.sections.push(section)
    saveSongs()
    return section
  }

  /**
   * Fügt eine neue Zeile zu einem Abschnitt hinzu
   * @param sectionId - Die ID des Abschnitts
   * @returns Die neu erstellte Zeile oder undefined bei Fehler
   */
  const addLine = (sectionId: string | number): Line | undefined => {
    debug('Adding line to section:', sectionId)
    if (!currentSong.value) return undefined

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section) return undefined

    const newLine: Line = {
      id: Date.now(),
      text: '',
      syllables: 0
    }

    section.lines.push(newLine)
    saveSongs()
    return newLine
  }

  /**
   * Löscht eine Zeile aus einem Abschnitt
   * @param sectionId - Die ID des Abschnitts
   * @param lineId - Die ID der Zeile
   */
  const deleteLine = (sectionId: string | number, lineId: string | number): void => {
    debug('Deleting line:', lineId, 'from section:', sectionId)
    if (!currentSong.value) return

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section) return

    const lineIndex = section.lines.findIndex(l => l.id === lineId)
    if (lineIndex !== -1) {
      section.lines.splice(lineIndex, 1)
      saveSongs()
    }
  }

  /**
   * Löscht einen Abschnitt aus dem aktuellen Song
   * @param sectionId - Die ID des Abschnitts
   */
  const deleteSection = (sectionId: string | number): void => {
    debug('Deleting section:', sectionId)
    if (!currentSong.value) return

    const sectionIndex = currentSong.value.sections.findIndex(s => s.id === sectionId)
    if (sectionIndex !== -1) {
      currentSong.value.sections.splice(sectionIndex, 1)
      saveSongs()
    }
  }

  /**
   * Verschiebt eine Zeile von einem Abschnitt zu einem anderen
   * @param fromSectionId - Die ID des Ausgangsabschnitts
   * @param toSectionId - Die ID des Zielabschnitts
   * @param lineIndex - Der Index der Zeile im Ausgangsabschnitt
   * @param newIndex - Der neue Index der Zeile im Zielabschnitt
   */
  const moveLine = (
    fromSectionId: string | number, 
    toSectionId: string | number, 
    lineIndex: number, 
    newIndex: number
  ): void => {
    if (!currentSong.value) return
    
    const fromSection = currentSong.value.sections.find(s => s.id === fromSectionId)
    const toSection = currentSong.value.sections.find(s => s.id === toSectionId)
    
    if (!fromSection || !toSection) {
      error('Unable to find sections', {fromSectionId, toSectionId})
      return
    }
    
    const [line] = fromSection.lines.splice(lineIndex, 1)
    toSection.lines.splice(newIndex, 0, line)
    saveSongs()
  }

  /**
   * Verschiebt einen Abschnitt an eine neue Position
   * @param fromIndex - Der aktuelle Index des Abschnitts
   * @param toIndex - Der neue Index des Abschnitts
   */
  const moveSection = (fromIndex: number, toIndex: number): void => {
    if (!currentSong.value) {
      error('No current song selected',11024)
      return
    }
    
    if (fromIndex < 0 || fromIndex >= currentSong.value.sections.length || 
        toIndex < 0 || toIndex >= currentSong.value.sections.length) {
      error('Invalid section indices', {fromIndex, toIndex, sectionsLength: currentSong.value.sections.length})
      return
    }
    
    debug('Moving section', currentSong.value.sections[fromIndex].title, 'from', fromIndex, 'to', toIndex)
    
    const [section] = currentSong.value.sections.splice(fromIndex, 1)
    currentSong.value.sections.splice(toIndex, 0, section)
    
    saveSongs()
  }

  /**
   * Speichert eine Audioaufnahme für einen Abschnitt
   * @param sectionId - Die ID des Abschnitts
   * @param audioBlob - Die Audiodaten als Blob
   * @param metadata - Metadaten zur Aufnahme
   */
  const saveRecording = (
    sectionId: string | number, 
    audioBlob: Blob, 
    metadata: RecordingMetadata = {}
  ): void => {
    if (!currentSong.value) return;

    const section = currentSong.value.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    audio('fileManager.saveRecording - Metadata received:', metadata);
    
    // Sicherstellen, dass audioBlob wirklich ein Blob ist
    if (!(audioBlob instanceof Blob)) {
      audio('fileManager.saveRecording - Received invalid blob:', audioBlob);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = () => {
      if (!reader.result) return;
      
      const base64data = reader.result.toString();
      section.recording = {
        id: Date.now(),
        data: base64data,
        timestamp: new Date().toISOString(),
        duration: metadata.duration || 0
      };
      audio('fileManager.saveRecording - Recording saved with duration:', section.recording.duration);
      saveSongs();
    };
    
    reader.onerror = (error) => {
      audio('fileManager.saveRecording - Error reading blob:', error);
    };
  }

  /**
   * Löscht eine Audioaufnahme aus einem Abschnitt
   * @param sectionId - Die ID des Abschnitts
   */
  const deleteRecording = (sectionId: string | number): void => {
    if (!currentSong.value) return

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section) return

    section.recording = null
    saveSongs()
  }

  /**
   * Löscht den aktuellen Song
   */
  const deleteCurrentSong = async (): Promise<void> => {
    if (currentSong.value) {
      await deleteSong(currentSong.value.id)
    }
  }

  /**
   * Generiert einen Titel für einen neuen Abschnitt
   * @param type - Der Typ des Abschnitts
   * @param sections - Die vorhandenen Abschnitte
   * @returns Der generierte Titel
   */
  const generateSectionTitle = (type: string, sections: Section[]): string => {
    const sameTypeCount = sections.filter(s => s.type === type).length
    
    // Standardtitel für verschiedene Typen
    const typeLabels: Record<string, string> = {
      verse: 'Verse',
      chorus: 'Chorus',
      bridge: 'Bridge',
      intro: 'Intro',
      outro: 'Outro',
      pre_chorus: 'Pre-Chorus',
      post_chorus: 'Post-Chorus',
      hook: 'Hook',
      refrain: 'Refrain',
      note: 'Note'
    }
    
    const baseTitle = typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1)
    
    // Wenn es bereits Abschnitte dieses Typs gibt, nummerieren
    return sameTypeCount > 0 ? `${baseTitle} ${sameTypeCount + 1}` : baseTitle
  }

  // ==================== COLLABORATION AUTHORSHIP FUNCTIONS ====================

  /**
   * Set authorship information for a line
   * @param sectionId - The ID of the section
   * @param lineId - The ID of the line
   * @param authorId - The ID of the author
   * @param authorColor - The color of the author
   */
  const setLineAuthor = (
    sectionId: string | number, 
    lineId: string | number, 
    authorId: string, 
    authorColor: string
  ): void => {
    if (!currentSong.value) return

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section) return

    const line = section.lines.find(l => l.id === lineId)
    if (!line) return

    // Set or update authorship information
    if (!line.authorId) {
      line.authorId = authorId
      line.authorColor = authorColor
    }
    line.lastModifiedBy = authorId
    line.lastModifiedAt = new Date().toISOString()
    
    saveSongs()
  }

  /**
   * Set authorship information for a section (note sections)
   * @param sectionId - The ID of the section
   * @param authorId - The ID of the author
   * @param authorColor - The color of the author
   */
  const setSectionAuthor = (
    sectionId: string | number, 
    authorId: string, 
    authorColor: string
  ): void => {
    if (!currentSong.value) return

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section) return

    // Set or update authorship information
    if (!section.authorId) {
      section.authorId = authorId
      section.authorColor = authorColor
    }
    section.lastModifiedBy = authorId
    section.lastModifiedAt = new Date().toISOString()
    
    saveSongs()
  }

  /**
   * Get the color for a line based on its authorship
   * @param sectionId - The ID of the section
   * @param lineId - The ID of the line
   * @returns The color of the line's author or null if not set
   */
  const getLineAuthorColor = (
    sectionId: string | number, 
    lineId: string | number
  ): string | null => {
    if (!currentSong.value) return null

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section) return null

    const line = section.lines.find(l => l.id === lineId)
    if (!line || !line.authorColor) return null

    return line.authorColor
  }

  /**
   * Get the color for a section based on its authorship
   * @param sectionId - The ID of the section
   * @returns The color of the section's author or null if not set
   */
  const getSectionAuthorColor = (sectionId: string | number): string | null => {
    if (!currentSong.value) return null

    const section = currentSong.value.sections.find(s => s.id === sectionId)
    if (!section || !section.authorColor) return null

    return section.authorColor
  }

  // ==================== CLOUD SYNC FUNCTIONS ====================
  
  /**
   * Enable cloud sync for authenticated user
   * @param userId - The authenticated user's ID
   */
  const enableCloudSync = async (userId: string): Promise<boolean> => {
    try {
      cloudSyncEnabled.value = true
      sync(`✅ Cloud sync enabled for user: ${userId}`)
      debug(`📊 Auto-syncing ${songs.value.length} existing local songs to cloud...`,14812)
      
      // Automatically sync existing songs to cloud (dual storage)
      if (songs.value.length > 0) {
        await syncSongsToCloud(userId)
        sync('🔄 Background sync: All local songs synchronized to cloud',15117)
      }
      
      // Also load any existing cloud songs that aren't local yet
      await loadSongsFromCloud(userId)
      sync('⬇️ Background sync: Cloud songs loaded to local storage',15316)
      
      return true
    } catch (error) {
      sync('❌ Error enabling cloud sync:', error)
      cloudSyncEnabled.value = false
      return false
    }
  }

  /**
   * Disable cloud sync
   */
  const disableCloudSync = (): void => {
    cloudSyncEnabled.value = false
    cloudSyncStatus.value = 'idle'
    cloudSyncError.value = null
    sync('☁️ Cloud sync disabled',15734)
  }

  /**
   * Migrate existing local songs to new cloud structure
   * @param userId - The authenticated user's ID
   */
  const migrateToNewCloudStructure = async (userId: string): Promise<CloudSyncResult> => {
    if (!cloudSyncEnabled.value) {
      return { success: false, error: 'Cloud sync not enabled' }
    }

    try {
      cloudSyncStatus.value = 'syncing'
      cloudSyncError.value = null
      
      sync('🔄 Starting migration to new cloud structure...',16190)
      const result = await cloudStorage.migrateSongsToNewStructure(songs.value, userId)
      
      if (result.success) {
        // After successful migration, load the migrated songs from cloud
        // This will update local songs with new cloud IDs
        await loadSongsFromCloud(userId)
        storage('✅ Migration completed and songs reloaded',16558)
      } else {
        cloudSyncStatus.value = 'error'
        cloudSyncError.value = result.error || 'Migration failed'
        error('❌ Migration failed:', result.error)
      }
      
      return result
    } catch (error) {
      cloudSyncStatus.value = 'error'
      cloudSyncError.value = error instanceof Error ? error.message : 'Unknown error'
      error('❌ Migration error:', error)
      return { success: false, error: cloudSyncError.value }
    }
  }

  /**
   * Sync all local songs to cloud
   * @param userId - The authenticated user's ID
   */
  const syncSongsToCloud = async (userId: string): Promise<CloudSyncResult> => {
    if (!cloudSyncEnabled.value) {
      return { success: false, error: 'Cloud sync not enabled' }
    }

    try {
      cloudSyncStatus.value = 'syncing'
      cloudSyncError.value = null
      
      const result = await cloudStorage.syncSongsToCloud(songs.value, userId)
      
      if (result.success) {
        cloudSyncStatus.value = 'success'
        lastCloudSyncTime.value = new Date().toISOString()
        cloudSongsCount.value = result.songsCount || 0
        sync('✅ Successfully synced songs to cloud',17732)
      } else {
        cloudSyncStatus.value = 'error'
        cloudSyncError.value = result.error || 'Unknown sync error'
        sync('❌ Cloud sync failed:', result.error)
      }
      
      return result
    } catch (error) {
      cloudSyncStatus.value = 'error'
      cloudSyncError.value = error instanceof Error ? error.message : 'Unknown error'
      sync('❌ Cloud sync error:', error)
      return { success: false, error: cloudSyncError.value }
    }
  }

  /**
   * Load songs from cloud and merge with local songs
   * @param userId - The authenticated user's ID
   */
  const loadSongsFromCloud = async (userId: string): Promise<void> => {
    if (!cloudSyncEnabled.value) {
      sync('⚠️ Cloud sync not enabled',18480)
      return
    }

    try {
      cloudSyncStatus.value = 'syncing'
      cloudSyncError.value = null
      
      const cloudSongs = await cloudStorage.getUserSongs(userId)
      
      if (cloudSongs.length > 0) {
        // Convert cloud songs to local format
        const localSongs = cloudSongs.map(cloudSong => 
          cloudStorage.cloudSongToLocal(cloudSong)
        )
        
        // Simple merge strategy: replace local with cloud songs
        // TODO: Implement smarter merging based on timestamps
        songs.value = localSongs
        localStorage.setItem('songs', JSON.stringify(songs.value))
        
        cloudSongsCount.value = cloudSongs.length
        sync(`✅ Loaded ${cloudSongs.length} songs from cloud`,19208)
      }
      
      cloudSyncStatus.value = 'success'
      lastCloudSyncTime.value = new Date().toISOString()
    } catch (error) {
      cloudSyncStatus.value = 'error'
      cloudSyncError.value = error instanceof Error ? error.message : 'Unknown error'
      sync('❌ Error loading songs from cloud:', error)
      throw error
    }
  }

  /**
   * Save a single song to cloud
   * @param song - The song to save
   * @param userId - The authenticated user's ID
   */
  const saveSongToCloud = async (song: Song, userId: string): Promise<string | null> => {
    if (!cloudSyncEnabled.value) {
      return null
    }

    try {
      const cloudSongId = await cloudStorage.saveSong(song, userId)
      
      // Update local song with cloud ID if it's new
      if (typeof song.id === 'number' && cloudSongId) {
        const songIndex = songs.value.findIndex(s => s.id === song.id)
        if (songIndex !== -1) {
          songs.value[songIndex].id = cloudSongId
          localStorage.setItem('songs', JSON.stringify(songs.value))
        }
      }
      
      return cloudSongId
    } catch (error) {
      sync('❌ Error saving song to cloud:', error)
      return null
    }
  }

  /**
   * Delete a song from cloud
   * @param songId - The song ID to delete
   * @param userId - The authenticated user's ID
   */
  const deleteSongFromCloud = async (songId: string, userId: string): Promise<void> => {
    if (!cloudSyncEnabled.value || typeof songId !== 'string') {
      return
    }

    try {
      await cloudStorage.deleteSong(songId, userId)
      sync(`✅ Deleted song ${songId} from cloud`,20836)
    } catch (error) {
      sync('❌ Error deleting song from cloud:', error)
      throw error
    }
  }

  /**
   * Get cloud sync status and statistics
   * @param userId - The authenticated user's ID
   */
  const getCloudSyncStatus = async (userId: string) => {
    if (!cloudSyncEnabled.value) {
      return null
    }

    try {
      return await cloudStorage.getSyncStatus(userId)
    } catch (error) {
      sync('❌ Error getting cloud sync status:', error)
      return null
    }
  }

  /**
   * Check if cloud storage is available
   */
  const checkCloudAvailability = async (userId?: string): Promise<boolean> => {
    try {
      return await cloudStorage.isCloudAvailable(userId)
    } catch (error) {
      sync('❌ Cloud availability check failed:', error)
      return false
    }
  }

  /**
   * Reset cloud sync status
   */
  const resetCloudSyncStatus = (): void => {
    cloudSyncStatus.value = 'idle'
    cloudSyncError.value = null
  }

  return {
    songs,
    currentSongId,
    currentSong,
    
    // Cloud sync state
    cloudSyncEnabled,
    cloudSyncStatus,
    cloudSyncError,
    lastCloudSyncTime,
    cloudSongsCount,
    
    // Song management functions
    loadSongs,
    saveSongs,
    createNewSong,
    selectSong,
    deleteSong,
    updateSong,
    addSection,
    addLine,
    deleteLine,
    deleteSection,
    moveLine,
    moveSection,
    saveRecording,
    deleteRecording,
    deleteCurrentSong,
    
    // Cloud Sync functions
    enableCloudSync,
    disableCloudSync,
    migrateToNewCloudStructure,
    syncSongsToCloud,
    loadSongsFromCloud,
    saveSongToCloud,
    deleteSongFromCloud,
    getCloudSyncStatus,
    checkCloudAvailability,
    resetCloudSyncStatus,
    
    // Collaboration authorship functions
    setLineAuthor,
    setSectionAuthor,
    getLineAuthorColor,
    getSectionAuthorColor
  }
}) 