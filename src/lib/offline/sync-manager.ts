'use client'

import { OfflineQueue } from '@/lib/pwa/service-worker'

export interface SyncableAction {
  id: string
  type: string
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

export interface SyncResult {
  success: boolean
  error?: string
  data?: any
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager
  private syncQueue: SyncableAction[] = []
  private isOnline: boolean = navigator.onLine
  private syncInProgress: boolean = false
  private syncHandlers: Map<string, (data: any) => Promise<SyncResult>> = new Map()

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager()
    }
    return OfflineSyncManager.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      // Load queue from localStorage
      this.loadQueue()
      
      // Listen for online/offline events
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
      
      // Register default sync handlers
      this.registerDefaultHandlers()
      
      // Start periodic sync attempts
      this.startPeriodicSync()
    }
  }

  private loadQueue(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('offline-sync-queue')
        if (stored) {
          this.syncQueue = JSON.parse(stored)
        }
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
      this.syncQueue = []
    }
  }

  private saveQueue(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('offline-sync-queue', JSON.stringify(this.syncQueue))
      }
    } catch (error) {
      console.error('Failed to save sync queue:', error)
    }
  }

  private handleOnline(): void {
    this.isOnline = true
    console.log('Back online - starting sync')
    this.syncAll()
  }

  private handleOffline(): void {
    this.isOnline = false
    console.log('Gone offline - queuing actions')
  }

  private startPeriodicSync(): void {
    // Attempt sync every 30 seconds when online
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0 && !this.syncInProgress) {
        this.syncAll()
      }
    }, 30000)
  }

  // Register sync handlers for different action types
  registerSyncHandler(type: string, handler: (data: any) => Promise<SyncResult>): void {
    this.syncHandlers.set(type, handler)
  }

  private registerDefaultHandlers(): void {
    // Analytics tracking
    this.registerSyncHandler('analytics', async (data) => {
      try {
        const response = await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          return { success: true }
        } else {
          return { success: false, error: `HTTP ${response.status}` }
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    })

    // Product interactions
    this.registerSyncHandler('product-interaction', async (data) => {
      try {
        const response = await fetch('/api/products/interaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          return { success: true }
        } else {
          return { success: false, error: `HTTP ${response.status}` }
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    })

    // User preferences
    this.registerSyncHandler('user-preferences', async (data) => {
      try {
        const response = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        
        if (response.ok) {
          return { success: true }
        } else {
          return { success: false, error: `HTTP ${response.status}` }
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    })

    // Wishlist actions
    this.registerSyncHandler('wishlist', async (data) => {
      try {
        const { action, productId } = data
        const url = action === 'add' 
          ? '/api/wishlist' 
          : `/api/wishlist/${productId}`
        
        const response = await fetch(url, {
          method: action === 'add' ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: action === 'add' ? JSON.stringify({ productId }) : undefined
        })
        
        if (response.ok) {
          return { success: true }
        } else {
          return { success: false, error: `HTTP ${response.status}` }
        }
      } catch (error) {
        return { success: false, error: error.message }
      }
    })
  }

  // Add action to sync queue
  queueAction(type: string, data: any, maxRetries: number = 3): void {
    const action: SyncableAction = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    }

    this.syncQueue.push(action)
    this.saveQueue()

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncAction(action)
    }
  }

  // Sync a single action
  private async syncAction(action: SyncableAction): Promise<boolean> {
    const handler = this.syncHandlers.get(action.type)
    if (!handler) {
      console.warn(`No sync handler for action type: ${action.type}`)
      return false
    }

    try {
      const result = await handler(action.data)
      
      if (result.success) {
        // Remove from queue
        this.syncQueue = this.syncQueue.filter(a => a.id !== action.id)
        this.saveQueue()
        return true
      } else {
        // Increment retry count
        action.retryCount++
        
        if (action.retryCount >= action.maxRetries) {
          // Max retries reached, remove from queue
          console.error(`Max retries reached for action ${action.id}:`, result.error)
          this.syncQueue = this.syncQueue.filter(a => a.id !== action.id)
          this.saveQueue()
        }
        
        return false
      }
    } catch (error) {
      console.error(`Sync error for action ${action.id}:`, error)
      action.retryCount++
      
      if (action.retryCount >= action.maxRetries) {
        this.syncQueue = this.syncQueue.filter(a => a.id !== action.id)
        this.saveQueue()
      }
      
      return false
    }
  }

  // Sync all queued actions
  async syncAll(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return
    }

    this.syncInProgress = true
    console.log(`Starting sync of ${this.syncQueue.length} actions`)

    const actionsToSync = [...this.syncQueue]
    let successCount = 0

    for (const action of actionsToSync) {
      const success = await this.syncAction(action)
      if (success) {
        successCount++
      }
      
      // Small delay between requests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Sync completed: ${successCount}/${actionsToSync.length} successful`)
    this.syncInProgress = false

    // Dispatch sync completion event
    window.dispatchEvent(new CustomEvent('sync-completed', {
      detail: { successful: successCount, total: actionsToSync.length }
    }))
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean
    queueLength: number
    syncInProgress: boolean
  } {
    return {
      isOnline: this.isOnline,
      queueLength: this.syncQueue.length,
      syncInProgress: this.syncInProgress
    }
  }

  // Clear sync queue (for testing or reset)
  clearQueue(): void {
    this.syncQueue = []
    this.saveQueue()
  }

  // Get queued actions (for debugging)
  getQueuedActions(): SyncableAction[] {
    return [...this.syncQueue]
  }
}

// Offline-aware data manager
export class OfflineDataManager {
  private static instance: OfflineDataManager
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map()
  private syncManager: OfflineSyncManager

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager()
    }
    return OfflineDataManager.instance
  }

  constructor() {
    this.syncManager = OfflineSyncManager.getInstance()
    this.loadCache()
  }

  private loadCache(): void {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('offline-data-cache')
        if (stored) {
          const cacheData = JSON.parse(stored)
          this.cache = new Map(cacheData)
        }
      }
    } catch (error) {
      console.error('Failed to load offline cache:', error)
    }
  }

  private saveCache(): void {
    try {
      if (typeof window !== 'undefined') {
        const cacheData = Array.from(this.cache.entries())
        localStorage.setItem('offline-data-cache', JSON.stringify(cacheData))
      }
    } catch (error) {
      console.error('Failed to save offline cache:', error)
    }
  }

  // Cache data with TTL
  cacheData(key: string, data: any, ttlMinutes: number = 60): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    })
    this.saveCache()
  }

  // Get cached data
  getCachedData(key: string): any | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      this.saveCache()
      return null
    }

    return cached.data
  }

  // Offline-aware fetch
  async fetchWithCache(
    url: string, 
    options: RequestInit = {}, 
    cacheKey?: string,
    cacheTTL: number = 60
  ): Promise<any> {
    const key = cacheKey || url

    // If offline, return cached data
    if (!navigator.onLine) {
      const cached = this.getCachedData(key)
      if (cached) {
        return cached
      }
      throw new Error('No cached data available offline')
    }

    try {
      const response = await fetch(url, options)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Cache successful responses
      if (options.method === 'GET' || !options.method) {
        this.cacheData(key, data, cacheTTL)
      }

      return data
    } catch (error) {
      // If network fails, try cached data
      const cached = this.getCachedData(key)
      if (cached) {
        console.warn('Network failed, using cached data:', error)
        return cached
      }
      throw error
    }
  }

  // Queue action for offline sync
  queueAction(type: string, data: any): void {
    this.syncManager.queueAction(type, data)
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('offline-data-cache')
    }
  }
}

// Export singleton instances
export const offlineSyncManager = OfflineSyncManager.getInstance()
export const offlineDataManager = OfflineDataManager.getInstance()