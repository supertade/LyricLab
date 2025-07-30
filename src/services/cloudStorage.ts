// Platform-Aware Cloud Storage Service
import { Capacitor } from '@capacitor/core'
import { withRetry, getFirestore, getCurrentUser } from './firebase'
import type { Song } from '../stores/fileManager'
import { sync, error as logError } from '../utils/logger'

// Platform detection
const isNative = Capacitor.isNativePlatform()
const isWeb = Capacitor.getPlatform() === 'web'

// Cloud song interface (adds cloud-specific fields)
export interface CloudSong extends Omit<Song, 'id'> {
  id?: string // Firestore document ID
  userId: string // Owner of the song
  createdAt?: any // Firestore timestamp
  updatedAt?: any // Firestore timestamp
  isDeleted?: boolean // Soft delete flag
}

export interface CloudSyncResult {
  success: boolean
  error?: string
  songsCount?: number
}

export class CloudStorageService {
  /**
   * Get all songs for a specific user
   */
  async getUserSongs(userId: string): Promise<CloudSong[]> {
    return withRetry(async () => {
      const firestore = await getFirestore()
      
      if (isNative && firestore) {
        console.log('🔥 Getting songs via native Firestore...')
        try {
          const result = await firestore.getCollection({
            reference: `users/${userId}/songs`,
            compositeFilter: {
              type: 'and',
              queryConstraints: [
                {
                  type: 'where',
                  fieldPath: 'isDeleted',
                  opStr: '!=',
                  value: true
                }
              ]
            }
          })
          
          const songs: CloudSong[] = result.documents.map((doc: any) => ({
            ...doc.data,
            id: doc.id,
            userId
          }))
          
          return songs
        } catch (error) {
          console.error('Native Firestore query failed:', error)
          // Fallback to simple get without filter
          try {
            const result = await firestore.getCollection({
              reference: `users/${userId}/songs`
            })
            
            const songs: CloudSong[] = result.documents
              .filter((doc: any) => !doc.data.isDeleted)
              .map((doc: any) => ({
                ...doc.data,
                id: doc.id,
                userId
              }))
            
            return songs
          } catch (fallbackError) {
            console.error('Native Firestore fallback failed:', fallbackError)
            return []
          }
        }
      } else if (isWeb && firestore) {
        console.log('🌐 Getting songs via web Firestore...')
        const { collection, query, orderBy, getDocs } = await import('firebase/firestore')
        
        const songsRef = collection(firestore, 'users', userId, 'songs')
        const q = query(songsRef, orderBy('updatedAt', 'desc'))
        
        const querySnapshot = await getDocs(q)
        const songs: CloudSong[] = []
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() as CloudSong
          // Client-side filtering for deleted songs
          if (!data.isDeleted) {
            songs.push({
              ...data,
              id: doc.id,
              userId
            })
          }
        })
        
        return songs
      } else {
        console.warn('No Firestore implementation available')
        return []
      }
    }).catch(error => {
      logError('❌ Error loading songs from cloud:', error)
      throw new Error(`Failed to load songs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    })
  }

  /**
   * Check if user is verified before allowing cloud operations
   */
  private async checkEmailVerification(): Promise<void> {
    const user = await getCurrentUser()
    if (!user) {
      throw new Error('Benutzer nicht angemeldet.')
    }
    
    // Handle different user object structures (native vs web)
    const emailVerified = user.emailVerified || user.user?.emailVerified || false
    
    if (!emailVerified) {
      throw new Error('E-Mail-Bestätigung erforderlich. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Cloud-Synchronisation zu nutzen.')
    }
  }

  /**
   * Save a song to the cloud (create or update)
   */
  async saveSong(song: Song, userId: string): Promise<string> {
    await this.checkEmailVerification()
    
    return withRetry(async () => {
      const firestore = await getFirestore()
      
      // Destructure to remove id from spread
      const { id, ...songWithoutId } = song
      
      const songData: any = {
        ...songWithoutId,
        userId,
        updatedAt: new Date().toISOString(),
        isDeleted: false
      }

      if (isNative && firestore) {
        console.log('🔥 Saving song via native Firestore...')
        
        if (typeof id === 'string' && id.length > 10) {
          // Update existing document
          try {
            await firestore.setDocument({
              reference: `users/${userId}/songs/${id}`,
              data: songData,
              merge: true
            })
            return id
          } catch (error) {
            console.error('Failed to update song, creating new one:', error)
          }
        }
        
        // Create new document
        songData.createdAt = new Date().toISOString()
        const result = await firestore.addDocument({
          reference: `users/${userId}/songs`,
          data: songData
        })
        
        return result.id
        
      } else if (isWeb && firestore) {
        console.log('🌐 Saving song via web Firestore...')
        const { 
          doc, 
          getDoc, 
          setDoc, 
          updateDoc, 
          collection, 
          addDoc, 
          serverTimestamp 
        } = await import('firebase/firestore')

        songData.updatedAt = serverTimestamp()

        // If song has an ID and it's a string (Firestore doc ID), try to update existing
        if (typeof id === 'string' && id.length > 10) {
          const songRef = doc(firestore, 'users', userId, 'songs', id)
          
          // Check if document exists before trying to update
          const songDoc = await getDoc(songRef)
          if (songDoc.exists()) {
            await updateDoc(songRef, songData)
            return id
          } else {
            // Document doesn't exist, create new one
            songData.createdAt = serverTimestamp()
            const songsRef = collection(firestore, 'users', userId, 'songs')
            const docRef = await addDoc(songsRef, songData)
            return docRef.id
          }
        } else {
          // Create new song
          songData.createdAt = serverTimestamp()
          const songsRef = collection(firestore, 'users', userId, 'songs')
          const docRef = await addDoc(songsRef, songData)
          return docRef.id
        }
      } else {
        throw new Error('No Firestore implementation available')
      }
    }).catch(error => {
      logError('❌ Error saving song to cloud:', error)
      throw new Error(`Failed to save song: ${error instanceof Error ? error.message : 'Unknown error'}`)
    })
  }

  /**
   * Delete a song from the cloud (soft delete)
   */
  async deleteSong(songId: string, userId: string): Promise<void> {
    try {
      const firestore = await getFirestore()
      
      if (isNative && firestore) {
        await firestore.setDocument({
          reference: `users/${userId}/songs/${songId}`,
          data: {
            isDeleted: true,
            updatedAt: new Date().toISOString()
          },
          merge: true
        })
      } else if (isWeb && firestore) {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
        const songRef = doc(firestore, 'users', userId, 'songs', songId)
        
        await updateDoc(songRef, {
          isDeleted: true,
          updatedAt: serverTimestamp()
        })
      }
    } catch (error) {
      logError('❌ Error deleting song from cloud:', error)
      throw new Error(`Failed to delete song: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Convert cloud song to local song format
   */
  cloudSongToLocal(cloudSong: CloudSong): Song {
    const { userId, createdAt, updatedAt, isDeleted, ...localSong } = cloudSong
    
    return {
      ...localSong,
      id: cloudSong.id || Date.now(),
      createdAt: typeof createdAt === 'string' ? createdAt : createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: typeof updatedAt === 'string' ? updatedAt : updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }
  }

  /**
   * Check if cloud storage is available and user is connected
   */
  async isCloudAvailable(userId?: string): Promise<boolean> {
    return withRetry(async () => {
      const firestore = await getFirestore()
      
      if (isNative && firestore) {
        try {
          // Test native Firestore connection
          await firestore.enableNetwork()
          return true
        } catch (error) {
          console.warn('Native Firestore not available:', error)
          return false
        }
      } else if (isWeb && firestore) {
        try {
          const { doc, getDoc } = await import('firebase/firestore')
          const testRef = doc(firestore, 'test', 'connectivity')
          await getDoc(testRef)
          return true
        } catch (error) {
          console.warn('Web Firestore not available:', error)
          return false
        }
      }
      return false
    }).catch(error => {
      sync.warn('Cloud storage not available:', error)
      return false
    })
  }

  /**
   * Get sync status and statistics
   */
  async getSyncStatus(userId: string): Promise<{
    totalSongs: number
    lastSyncTime: string | null
  }> {
    try {
      const songs = await this.getUserSongs(userId)
      const lastSyncTime = songs.length > 0 ? 
        Math.max(...songs.map(s => new Date(s.updatedAt || 0).getTime())) : 
        null
      
      return {
        totalSongs: songs.length,
        lastSyncTime: lastSyncTime ? new Date(lastSyncTime).toISOString() : null
      }
    } catch (error) {
      logError('❌ Error getting sync status:', error)
      return {
        totalSongs: 0,
        lastSyncTime: null
      }
    }
  }

  /**
   * Sync all local songs to cloud
   */
  async syncSongsToCloud(songs: Song[], userId: string): Promise<CloudSyncResult> {
    try {
      let syncedCount = 0
      const errors: string[] = []

      for (const song of songs) {
        try {
          await this.saveSong(song, userId)
          syncedCount++
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          errors.push(`Song "${song.title}": ${errorMsg}`)
        }
      }

      if (errors.length > 0) {
        sync.warn(`⚠️ Some songs failed to sync: ${errors.join(', ')}`)
        return {
          success: false,
          error: `${errors.length} songs failed to sync`,
          songsCount: syncedCount
        }
      }

      return {
        success: true,
        songsCount: syncedCount
      }
    } catch (error) {
      logError('❌ Error syncing songs to cloud:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

// Export singleton instance
export const cloudStorage = new CloudStorageService()
export default cloudStorage 