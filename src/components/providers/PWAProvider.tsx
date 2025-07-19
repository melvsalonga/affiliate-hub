'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ServiceWorkerManager, PWAInstallManager, PushNotificationManager } from '@/lib/pwa/service-worker'
import { notificationService } from '@/lib/notifications/push-notifications'
import { offlineSyncManager, offlineDataManager } from '@/lib/offline/sync-manager'
import { toast } from 'react-hot-toast'

interface PWAContextType {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  isUpdateAvailable: boolean
  notificationPermission: NotificationPermission
  hasNotificationSupport: boolean
  installPWA: () => Promise<boolean>
  updatePWA: () => Promise<void>
  clearCache: () => Promise<void>
  enableNotifications: () => Promise<boolean>
  disableNotifications: () => Promise<void>
  syncData: () => Promise<void>
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function usePWA() {
  const context = useContext(PWAContext)
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}

interface PWAProviderProps {
  children: ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [hasNotificationSupport, setHasNotificationSupport] = useState(false)
  
  const [swManager] = useState(() => ServiceWorkerManager.getInstance())
  const [installManager] = useState(() => new PWAInstallManager())

  useEffect(() => {
    // Initialize service worker
    swManager.register().then((registration) => {
      if (registration) {
        notificationService.initialize(registration)
      }
    })

    // Set initial online status
    setIsOnline(navigator.onLine)

    // Set initial install status
    setIsInstalled(installManager.isInstalled())

    // Check notification support
    setHasNotificationSupport('Notification' in window)
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Listen for online/offline events
    const handleOnlineStatusChange = swManager.onOnlineStatusChange((online) => {
      setIsOnline(online)
      if (online) {
        toast.success('Back online! Syncing data...', {
          icon: '🌐'
        })
        // Trigger sync when back online
        offlineSyncManager.syncAll()
      } else {
        toast.error('You are offline. Actions will sync when connection returns.', {
          icon: '📱',
          duration: 6000
        })
      }
    })

    // Listen for install prompt
    const handleInstallAvailable = () => {
      setCanInstall(true)
      // Don't show toast immediately, let the component handle it
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      toast.success('LinkVault Pro has been installed!', {
        icon: '📱'
      })
    }

    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true)
      // Don't show toast immediately, let the component handle it
    }

    // Listen for sync completion
    const handleSyncCompleted = (event: CustomEvent) => {
      const { successful, total } = event.detail
      if (successful > 0) {
        toast.success(`Synced ${successful}/${total} actions`, {
          icon: '🔄'
        })
      }
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    window.addEventListener('pwa-installed', handleInstalled)
    window.addEventListener('sw-update-available', handleUpdateAvailable)
    window.addEventListener('sync-completed', handleSyncCompleted as EventListener)

    return () => {
      handleOnlineStatusChange()
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      window.removeEventListener('pwa-installed', handleInstalled)
      window.removeEventListener('sw-update-available', handleUpdateAvailable)
      window.removeEventListener('sync-completed', handleSyncCompleted as EventListener)
    }
  }, [swManager, installManager])

  const installPWA = async (): Promise<boolean> => {
    try {
      const result = await installManager.promptInstall()
      if (result) {
        setCanInstall(false)
        setIsInstalled(true)
      }
      return result
    } catch (error) {
      console.error('Failed to install PWA:', error)
      toast.error('Failed to install app')
      return false
    }
  }

  const updatePWA = async (): Promise<void> => {
    try {
      await swManager.update()
      setIsUpdateAvailable(false)
      toast.success('App updated successfully!', {
        icon: '✅'
      })
    } catch (error) {
      console.error('Failed to update PWA:', error)
      toast.error('Failed to update app')
    }
  }

  const clearCache = async (): Promise<void> => {
    try {
      await swManager.clearCache()
      offlineDataManager.clearCache()
      toast.success('Cache cleared successfully!', {
        icon: '🗑️'
      })
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error('Failed to clear cache')
    }
  }

  const enableNotifications = async (): Promise<boolean> => {
    try {
      const granted = await notificationService.requestPermission()
      if (granted) {
        const subscription = await notificationService.subscribe()
        if (subscription) {
          await notificationService.saveSubscription(subscription)
          setNotificationPermission('granted')
          toast.success('Notifications enabled!', {
            icon: '🔔'
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      toast.error('Failed to enable notifications')
      return false
    }
  }

  const disableNotifications = async (): Promise<void> => {
    try {
      await notificationService.unsubscribe()
      await notificationService.removeSubscription()
      setNotificationPermission('denied')
      toast.success('Notifications disabled', {
        icon: '🔕'
      })
    } catch (error) {
      console.error('Failed to disable notifications:', error)
      toast.error('Failed to disable notifications')
    }
  }

  const syncData = async (): Promise<void> => {
    try {
      await offlineSyncManager.syncAll()
    } catch (error) {
      console.error('Failed to sync data:', error)
      toast.error('Failed to sync data')
    }
  }

  const value: PWAContextType = {
    isOnline,
    isInstalled,
    canInstall,
    isUpdateAvailable,
    notificationPermission,
    hasNotificationSupport,
    installPWA,
    updatePWA,
    clearCache,
    enableNotifications,
    disableNotifications,
    syncData
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
      <PWANotifications />
    </PWAContext.Provider>
  )
}

// Component to handle PWA-related notifications and UI
function PWANotifications() {
  const { canInstall, isUpdateAvailable, installPWA, updatePWA } = usePWA()

  useEffect(() => {
    // Show install prompt after a delay
    if (canInstall) {
      const timer = setTimeout(() => {
        const shouldShow = !localStorage.getItem('pwa-install-dismissed')
        const lastShown = localStorage.getItem('pwa-install-last-shown')
        const now = Date.now()
        
        // Don't show more than once per day
        if (shouldShow && (!lastShown || now - parseInt(lastShown) > 24 * 60 * 60 * 1000)) {
          showInstallPrompt()
          localStorage.setItem('pwa-install-last-shown', now.toString())
        }
      }, 15000) // Show after 15 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstall])

  useEffect(() => {
    // Show update prompt
    if (isUpdateAvailable) {
      const timer = setTimeout(() => {
        showUpdatePrompt()
      }, 2000) // Small delay to avoid overwhelming user

      return () => clearTimeout(timer)
    }
  }, [isUpdateAvailable])

  const showInstallPrompt = () => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">📱</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Install LinkVault Pro
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Get the full app experience with offline access, push notifications, and faster loading.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  installPWA()
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Install App
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('pwa-install-dismissed', 'true')
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 20000,
      position: 'bottom-right'
    })
  }

  const showUpdatePrompt = () => {
    toast.custom((t) => (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border max-w-sm">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🔄</div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Update Available
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              A new version of LinkVault Pro is ready with improvements and bug fixes.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  updatePWA()
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 0, // Don't auto-dismiss
      position: 'bottom-right'
    })
  }

  return null
}