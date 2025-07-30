// Collaboration Service
import { Capacitor } from '@capacitor/core'
import { getFirestore, getCurrentUser, withRetry } from './firebase'
import type { Song } from '../stores/fileManager'
import { sync, error as logError } from '../utils/logger'

// Platform detection
const isNative = Capacitor.isNativePlatform()
const isWeb = Capacitor.getPlatform() === 'web'

export interface CollaborationInvite {
  id: string
  songId: string
  songTitle: string
  fromUserId: string
  fromUserEmail: string
  toUserEmail: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: any
  expiresAt: any
}

export interface Collaborator {
  userId: string
  email: string
  displayName?: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: any
}

export interface SharedSong extends Song {
  collaborators: Collaborator[]
  shareSettings: {
    allowEditing: boolean
    allowComments: boolean
    publicLink?: string
  }
}

export class CollaborationService {
  /**
   * Share a song with another user by email
   */
  async shareWithUser(songId: string, targetEmail: string, role: 'editor' | 'viewer' = 'editor'): Promise<void> {
    try {
      const firestore = await getFirestore()
      const currentUser = await getCurrentUser()
      
      if (!currentUser) {
        throw new Error('Benutzer nicht angemeldet')
      }

      // Handle different user object structures (native vs web)
      const emailVerified = currentUser.emailVerified || currentUser.user?.emailVerified || false
      const userEmail = currentUser.email || currentUser.user?.email
      const userId = currentUser.uid || currentUser.user?.uid

      if (!emailVerified) {
        throw new Error('E-Mail-Bestätigung erforderlich')
      }

      const inviteData = {
        songId,
        fromUserId: userId,
        fromUserEmail: userEmail,
        toUserEmail: targetEmail,
        role,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      }

      if (isNative && firestore) {
        await firestore.addDocument({
          reference: 'collaborationInvites',
          data: inviteData
        })
      } else if (isWeb && firestore) {
        const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')
        
        const invitesRef = collection(firestore, 'collaborationInvites')
        await addDoc(invitesRef, {
          ...inviteData,
          createdAt: serverTimestamp(),
          expiresAt: serverTimestamp()
        })
      }

      sync.info(`📤 Collaboration invite sent to ${targetEmail}`)
    } catch (error) {
      logError('❌ Error sharing song:', error)
      throw new Error(`Failed to share song: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get collaboration invites for the current user
   */
  async getUserCollaborations(userEmail: string): Promise<CollaborationInvite[]> {
    return withRetry(async () => {
      const firestore = await getFirestore()
      
      if (isNative && firestore) {
        try {
          const result = await firestore.getCollection({
            reference: 'collaborationInvites',
            compositeFilter: {
              type: 'and',
              queryConstraints: [
                {
                  type: 'where',
                  fieldPath: 'toUserEmail',
                  opStr: '==',
                  value: userEmail
                },
                {
                  type: 'where',
                  fieldPath: 'status',
                  opStr: '==',
                  value: 'pending'
                }
              ]
            }
          })
          
          return result.documents.map((doc: any) => ({
            ...doc.data,
            id: doc.id
          }))
        } catch (error) {
          console.error('Native Firestore collaboration query failed:', error)
          return []
        }
      } else if (isWeb && firestore) {
        const { collection, query, where, getDocs } = await import('firebase/firestore')
        
        const invitesRef = collection(firestore, 'collaborationInvites')
        const q = query(
          invitesRef,
          where('toUserEmail', '==', userEmail),
          where('status', '==', 'pending')
        )
        
        const querySnapshot = await getDocs(q)
        const invites: CollaborationInvite[] = []
        
        querySnapshot.forEach((doc) => {
          invites.push({
            ...doc.data(),
            id: doc.id
          } as CollaborationInvite)
        })
        
        return invites
      } else {
        console.warn('No Firestore implementation available for collaborations')
        return []
      }
    }).catch(error => {
      logError('❌ Error getting user collaborations:', error)
      return []
    })
  }

  /**
   * Accept a collaboration invite
   */
  async acceptInvite(inviteId: string): Promise<void> {
    try {
      const firestore = await getFirestore()
      
      if (isNative && firestore) {
        await firestore.setDocument({
          reference: `collaborationInvites/${inviteId}`,
          data: {
            status: 'accepted',
            acceptedAt: new Date().toISOString()
          },
          merge: true
        })
      } else if (isWeb && firestore) {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
        
        const inviteRef = doc(firestore, 'collaborationInvites', inviteId)
        await updateDoc(inviteRef, {
          status: 'accepted',
          acceptedAt: serverTimestamp()
        })
      }

      sync.info('✅ Collaboration invite accepted')
    } catch (error) {
      logError('❌ Error accepting invite:', error)
      throw new Error(`Failed to accept invite: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decline a collaboration invite
   */
  async declineInvite(inviteId: string): Promise<void> {
    try {
      const firestore = await getFirestore()
      
      if (isNative && firestore) {
        await firestore.setDocument({
          reference: `collaborationInvites/${inviteId}`,
          data: {
            status: 'declined',
            declinedAt: new Date().toISOString()
          },
          merge: true
        })
      } else if (isWeb && firestore) {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore')
        
        const inviteRef = doc(firestore, 'collaborationInvites', inviteId)
        await updateDoc(inviteRef, {
          status: 'declined',
          declinedAt: serverTimestamp()
        })
      }

      sync.info('❌ Collaboration invite declined')
    } catch (error) {
      logError('❌ Error declining invite:', error)
      throw new Error(`Failed to decline invite: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate a public share link for a song
   */
  async generatePublicLink(songId: string, userId: string): Promise<string> {
    try {
      const firestore = await getFirestore()
      const shareId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const shareData = {
        songId,
        userId,
        shareId,
        createdAt: new Date().toISOString(),
        isActive: true
      }

      if (isNative && firestore) {
        await firestore.setDocument({
          reference: `publicShares/${shareId}`,
          data: shareData
        })
      } else if (isWeb && firestore) {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore')
        
        const shareRef = doc(firestore, 'publicShares', shareId)
        await setDoc(shareRef, {
          ...shareData,
          createdAt: serverTimestamp()
        })
      }

      const publicLink = `${window.location.origin}/share/${shareId}`
      sync.info(`🔗 Public link generated: ${publicLink}`)
      
      return publicLink
    } catch (error) {
      logError('❌ Error generating public link:', error)
      throw new Error(`Failed to generate public link: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Check if collaboration features are available
   */
  async isCollaborationAvailable(): Promise<boolean> {
    try {
      const firestore = await getFirestore()
      return firestore !== null
    } catch (error) {
      console.warn('Collaboration features not available:', error)
      return false
    }
  }

  /**
   * Get real-time collaboration status
   */
  async getCollaborationStatus(songId: string): Promise<{
    activeCollaborators: number
    lastActivity: string | null
  }> {
    try {
      // This would typically involve real-time listeners
      // For now, return mock data
      return {
        activeCollaborators: 0,
        lastActivity: null
      }
    } catch (error) {
      logError('❌ Error getting collaboration status:', error)
      return {
        activeCollaborators: 0,
        lastActivity: null
      }
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService()
export default collaborationService 