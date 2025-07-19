'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { ServiceWorkerManager, PWAInstallManager, PushNotificationManager } from '@/lib/pwa/service-worker'
import { toast } from 'react-hot-toast'

interface PWAContextType {
  isOnline: boolean
  isInstalled: boolean
  canInstall: boolean
  isUpdateAvailable: boolean
  installPWA: () => Promise<boolean>
  updatePWA: () => Promise<void>
  clearCache: () => Promise<void>
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
  
  const [swManager] = useState(() => ServiceWorkerManager.getInstance())
  const [installManager] = useState(() => new PWAInstallManager())

  useEffect(() => {
    // Initialize service worker
    swManager.register()

    // Set initial online status
    setIsOnline(navigator.onLine)

    // Set initial install status
    setIsInstalled(installManager.isInstalled())

    // Listen for online/offline events
    const handleOnlineStatusChange = swManager.onOnlineStatusChange((online) => {
      setIsOnline(online)
      if (online) {
        toast.success('Back online! Syncing data...')
      } else {
        toast.error('You are offline. Some features may be limited.')
      }
    })

    // Listen for install prompt
    const handleInstallAvailable = () => {
      setCanInstall(true)
      toast.success('LinkVault Pro can be installed as an app!', {
        duration: 5000,
        icon: '📱'
      })
    }

    const handleInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      toast.success('LinkVault Pro has been installed!')
    }

    const handleUpdateAvailable = () => {
      setIsUpdateAvailable(true)
      toast.success('A new version is available!', {
        duration: 0, // Don't auto-dismiss
        icon: '🔄'
      })
    }

    window.addEventListener('pwa-install-available', handleInstallAvailable)
    window.addEventListener('pwa-installed', handleInstalled)
    window.addEventListener('sw-update-available', handleUpdateAvailable)

    return () => {
      handleOnlineStatusChange()
      window.removeEventListener('pwa-install-available', handleInstallAvailable)
      window.removeEventListener('pwa-installed', handleInstalled)
      window.removeEventListener('sw-update-available', handleUpdateAvailable)
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
      toast.success('App updated successfully!')
    } catch (error) {
      console.error('Failed to update PWA:', error)
      toast.error('Failed to update app')
    }
  }

  const clearCache = async (): Promise<void> => {
    try {
      await swManager.clearCache()
      toast.success('Cache cleared successfully!')
    } catch (error) {
      console.error('Failed to clear cache:', error)
      toast.error('Failed to clear cache')
    }
  }

  const value: PWAContextType = {
    isOnline,
    isInstalled,
    canInstall,
    isUpdateAvailable,
    installPWA,
    updatePWA,
    clearCache
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
        if (shouldShow) {
          showInstallPrompt()
        }
      }, 10000) // Show after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstall])

  useEffect(() => {
    // Show update prompt
    if (isUpdateAvailable) {
      showUpdatePrompt()
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
              Get the full app experience with offline access and faster loading.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  installPWA()
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Install
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('pwa-install-dismissed', 'true')
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    ), {
      duration: 15000,
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
              A new version of LinkVault Pro is ready to install.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={() => {
                  updatePWA()
                  toast.dismiss(t.id)
                }}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Update Now
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="px-3 py-1 text-gray-600 dark:text-gray-400 text-sm hover:text-gray-800 dark:hover:text-gray-200"
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