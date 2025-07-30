// User Color Service for Collaborative Text Editing
// Manages user color assignment and ensures consistent color mapping

export interface UserColorInfo {
  userId: string
  color: string
  displayName?: string
  email?: string
}

// Predefined user colors for collaboration (matching collaboration.ts)
export const USER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald/Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
] as const

export type UserColor = typeof USER_COLORS[number]

export class UserColorService {
  private static instance: UserColorService
  private userColorMap: Map<string, UserColorInfo> = new Map()
  private colorAssignments: Map<string, string[]> = new Map() // sessionId -> [userIds]

  static getInstance(): UserColorService {
    if (!UserColorService.instance) {
      UserColorService.instance = new UserColorService()
    }
    return UserColorService.instance
  }

  /**
   * Assign a color to a user in a collaboration session
   */
  assignUserColor(sessionId: string, userId: string, userEmail?: string, displayName?: string): UserColor {
    const sessionKey = `${sessionId}_${userId}`
    
    // Check if user already has a color assigned for this session
    if (this.userColorMap.has(sessionKey)) {
      return this.userColorMap.get(sessionKey)!.color as UserColor
    }

    // Get current assignments for this session
    const currentAssignments = this.colorAssignments.get(sessionId) || []
    
    // Find the next available color
    const colorIndex = currentAssignments.length % USER_COLORS.length
    const assignedColor = USER_COLORS[colorIndex]

    // Store the color assignment
    const colorInfo: UserColorInfo = {
      userId,
      color: assignedColor,
      displayName,
      email: userEmail
    }

    this.userColorMap.set(sessionKey, colorInfo)
    this.colorAssignments.set(sessionId, [...currentAssignments, userId])

    return assignedColor
  }

  /**
   * Get user's assigned color for a session
   */
  getUserColor(sessionId: string, userId: string): UserColor | null {
    const sessionKey = `${sessionId}_${userId}`
    const colorInfo = this.userColorMap.get(sessionKey)
    return colorInfo ? (colorInfo.color as UserColor) : null
  }

  /**
   * Get all user colors for a session
   */
  getSessionColors(sessionId: string): Map<string, UserColorInfo> {
    const sessionColors = new Map<string, UserColorInfo>()
    
    this.userColorMap.forEach((colorInfo, key) => {
      if (key.startsWith(`${sessionId}_`)) {
        sessionColors.set(colorInfo.userId, colorInfo)
      }
    })
    
    return sessionColors
  }

  /**
   * Remove user from session (when they leave)
   */
  removeUserFromSession(sessionId: string, userId: string): void {
    const sessionKey = `${sessionId}_${userId}`
    this.userColorMap.delete(sessionKey)
    
    // Update session assignments
    const currentAssignments = this.colorAssignments.get(sessionId) || []
    const updatedAssignments = currentAssignments.filter(id => id !== userId)
    this.colorAssignments.set(sessionId, updatedAssignments)
  }

  /**
   * Clear all data for a session (when collaboration ends)
   */
  clearSession(sessionId: string): void {
    // Remove all user color mappings for this session
    const keysToDelete: string[] = []
    this.userColorMap.forEach((_, key) => {
      if (key.startsWith(`${sessionId}_`)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.userColorMap.delete(key))
    this.colorAssignments.delete(sessionId)
  }

  /**
   * Get color for text authorship (returns hex color)
   */
  getTextColor(sessionId: string, userId: string): string {
    const color = this.getUserColor(sessionId, userId)
    return color || '#6B7280' // Default gray for unknown users
  }

  /**
   * Validate if a color is a valid user color
   */
  isValidUserColor(color: string): boolean {
    return USER_COLORS.includes(color as UserColor)
  }

  /**
   * Get color name for display purposes
   */
  getColorName(color: UserColor): string {
    const colorNames: Record<UserColor, string> = {
      '#3B82F6': 'Blue',
      '#10B981': 'Green',
      '#F59E0B': 'Amber',
      '#EF4444': 'Red',
      '#8B5CF6': 'Violet',
      '#06B6D4': 'Cyan',
      '#84CC16': 'Lime',
      '#F97316': 'Orange'
    }
    return colorNames[color] || 'Unknown'
  }

  /**
   * Get lighter version of color for backgrounds
   */
  getLighterColor(color: UserColor): string {
    const lightColors: Record<UserColor, string> = {
      '#3B82F6': '#DBEAFE', // Blue
      '#10B981': '#D1FAE5', // Green
      '#F59E0B': '#FEF3C7', // Amber
      '#EF4444': '#FEE2E2', // Red
      '#8B5CF6': '#EDE9FE', // Violet
      '#06B6D4': '#CFFAFE', // Cyan
      '#84CC16': '#ECFCCB', // Lime
      '#F97316': '#FED7AA', // Orange
    }
    return lightColors[color] || '#F3F4F6'
  }

  /**
   * Get darker version of color for better contrast
   */
  getDarkerColor(color: UserColor): string {
    const darkColors: Record<UserColor, string> = {
      '#3B82F6': '#1E40AF', // Blue
      '#10B981': '#047857', // Green
      '#F59E0B': '#D97706', // Amber
      '#EF4444': '#DC2626', // Red
      '#8B5CF6': '#7C3AED', // Violet
      '#06B6D4': '#0891B2', // Cyan
      '#84CC16': '#65A30D', // Lime
      '#F97316': '#EA580C', // Orange
    }
    return darkColors[color] || '#374151'
  }

  /**
   * Initialize colors from collaboration session data
   */
  initializeFromSession(sessionId: string, collaborators: Array<{uid: string, color: string, email?: string, displayName?: string}>): void {
    const userIds: string[] = []
    
    collaborators.forEach(collaborator => {
      const colorInfo: UserColorInfo = {
        userId: collaborator.uid,
        color: collaborator.color,
        email: collaborator.email,
        displayName: collaborator.displayName
      }
      
      this.userColorMap.set(`${sessionId}_${collaborator.uid}`, colorInfo)
      userIds.push(collaborator.uid)
    })
    
    this.colorAssignments.set(sessionId, userIds)
  }
}

// Export singleton instance
export const userColorService = UserColorService.getInstance() 