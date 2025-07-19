'use client'

// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager
  private registration: ServiceWorkerRegistration | null = null
  private updateAvailable = false

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager()
    }
    return ServiceWorkerManager.instance
  }

  async register(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('Service Worker not supported')
      return
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      })

      console.log('Service Worker registered successfully')

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.updateAvailable = true
              this.notifyUpdateAvailable()
            }
          })
        }
      })

      // Check for updates periodically
      setInterval(() => {
        this.registration?.update()
      }, 60000) // Check every minute

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister()
      console.log('Service Worker unregistered')
    }
  }

  async update(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  isUpdateAvailable(): boolean {
    return this.updateAvailable
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update notification
    window.dispatchEvent(new CustomEvent('sw-update-available'))
  }

  // Cache management
  async clearCache(): Promise<void> {
    if (this.registration?.active) {
      this.registration.active.postMessage({ type: 'CLEAR_CACHE' })
    }
  }

  async cacheUrls(urls: string[]): Promise<void> {
    if (this.registration?.active) {
      this.registration.active.postMessage({ 
        type: 'CACHE_URLS', 
        payload: urls 
      })
    }
  }

  // Offline detection
  isOnline(): boolean {
    return navigator.onLine
  }

  onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

// PWA installation prompt
export class PWAInstallManager {
  private deferredPrompt: any = null

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        this.deferredPrompt = e
        this.showInstallPromotion()
      })

      window.addEventListener('appinstalled', () => {
        console.log('PWA was installed')
        this.hideInstallPromotion()
      })
    }
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      return false
    }

    this.deferredPrompt.prompt()
    const { outcome } = await this.deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      return true
    } else {
      console.log('User dismissed the install prompt')
      return false
    }
  }

  canInstall(): boolean {
    return !!this.deferredPrompt
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  private showInstallPromotion(): void {
    // Dispatch event to show install promotion UI
    window.dispatchEvent(new CustomEvent('pwa-install-available'))
  }

  private hideInstallPromotion(): void {
    // Dispatch event to hide install promotion UI
    window.dispatchEvent(new CustomEvent('pwa-installed'))
  }
}

// Push notifications
export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null

  constructor(registration: ServiceWorkerRegistration | null) {
    this.registration = registration
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    return await Notification.requestPermission()
  }

  async subscribe(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service Worker not registered')
    }

    const permission = await this.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
      })

      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.registration) {
      return
    }

    const subscription = await this.registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null
    }

    return await this.registration.pushManager.getSubscription()
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }
}

// Background sync for offline actions
export class BackgroundSyncManager {
  private registration: ServiceWorkerRegistration | null = null

  constructor(registration: ServiceWorkerRegistration | null) {
    this.registration = registration
  }

  async sync(tag: string): Promise<void> {
    if (!this.registration || !('sync' in this.registration)) {
      console.warn('Background Sync not supported')
      return
    }

    try {
      await (this.registration as any).sync.register(tag)
      console.log('Background sync registered:', tag)
    } catch (error) {
      console.error('Background sync registration failed:', error)
    }
  }
}

// Offline queue for API requests
export class OfflineQueue {
  private static readonly QUEUE_KEY = 'offline-queue'

  static async add(request: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
  }): Promise<void> {
    const queue = await this.getQueue()
    queue.push({
      ...request,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    })
    await this.saveQueue(queue)
  }

  static async getQueue(): Promise<any[]> {
    if (typeof window === 'undefined') return []
    
    const stored = localStorage.getItem(this.QUEUE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  static async saveQueue(queue: any[]): Promise<void> {
    if (typeof window === 'undefined') return
    
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue))
  }

  static async clear(): Promise<void> {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(this.QUEUE_KEY)
  }

  static async process(): Promise<void> {
    const queue = await this.getQueue()
    const processed: string[] = []

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        })

        if (response.ok) {
          processed.push(item.id)
        }
      } catch (error) {
        console.error('Failed to process queued request:', error)
      }
    }

    // Remove processed items
    const remaining = queue.filter(item => !processed.includes(item.id))
    await this.saveQueue(remaining)
  }
}