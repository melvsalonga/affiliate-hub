'use client'

import React, { useState, useEffect } from 'react'
import { usePWA } from '@/components/providers/PWAProvider'
import { offlineSyncManager, offlineDataManager } from '@/lib/offline/sync-manager'
import { notificationService } from '@/lib/notifications/push-notifications'
import { cn } from '@/lib/utils'
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Bell, 
  BellOff, 
  Sync, 
  Check, 
  X, 
  Smartphone,
  RefreshCw
} from 'lucide-react'

interface PWAStatusProps {
  className?: string
  showDetails?: boolean
}

export function PWAStatus({ className, showDetails = false }: PWAStatusProps) {
  const { isOnline, isInstalled, canInstall, isUpdateAvailable, installPWA, updatePWA } = usePWA()
  const [syncStatus, setSyncStatus] = useState(offlineSyncManager.getSyncStatus())
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
    }

    // Check push subscription
    const checkSubscription = async () => {
      const subscription = await notificationService.getSubscription()
      setPushSubscription(subscription)
    }
    checkSubscription()

    // Listen for sync events
    const handleSyncCompleted = (event: CustomEvent) => {
      setSyncStatus(offlineSyncManager.getSyncStatus())
    }

    window.addEventListener('sync-completed', handleSyncCompleted as EventListener)

    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getSyncStatus())
    }, 5000)

    return () => {
      window.removeEventListener('sync-completed', handleSyncCompleted as EventListener)
      clearInterval(interval)
    }
  }, [])

  const handleInstallPWA = async () => {
    await installPWA()
  }

  const handleUpdatePWA = async () => {
    await updatePWA()
  }

  const handleEnableNotifications = async () => {
    try {
      const granted = await notificationService.requestPermission()
      if (granted) {
        const subscription = await notificationService.subscribe()
        if (subscription) {
          await notificationService.saveSubscription(subscription)
          setPushSubscription(subscription)
          setNotificationPermission('granted')
        }
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error)
    }
  }

  const handleDisableNotifications = async () => {
    try {
      await notificationService.unsubscribe()
      await notificationService.removeSubscription()
      setPushSubscription(null)
      setNotificationPermission('denied')
    } catch (error) {
      console.error('Failed to disable notifications:', error)
    }
  }

  const handleManualSync = async () => {
    await offlineSyncManager.syncAll()
  }

  if (!showDetails) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Online/Offline Status */}
        <div className={cn(
          'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
          isOnline 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        )}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Sync Status */}
        {syncStatus.queueLength > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Sync className={cn('w-3 h-3', syncStatus.syncInProgress && 'animate-spin')} />
            <span>{syncStatus.queueLength}</span>
          </div>
        )}

        {/* Install Prompt */}
        {canInstall && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800"
          >
            <Download className="w-3 h-3" />
            <span>Install</span>
          </button>
        )}

        {/* Update Available */}
        {isUpdateAvailable && (
          <button
            onClick={handleUpdatePWA}
            className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-200 dark:hover:bg-orange-800"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Update</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        PWA Status
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Connection
          </h4>
          <div className={cn(
            'flex items-center space-x-2 p-3 rounded-lg',
            isOnline 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          )}>
            {isOnline ? <Wifi className="w-5 h-5 text-green-600" /> : <WifiOff className="w-5 h-5 text-red-600" />}
            <div>
              <p className={cn(
                'font-medium',
                isOnline ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              )}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isOnline ? 'All features available' : 'Limited functionality'}
              </p>
            </div>
          </div>
        </div>

        {/* Installation Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Installation
          </h4>
          <div className={cn(
            'flex items-center space-x-2 p-3 rounded-lg',
            isInstalled 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
          )}>
            <Smartphone className={cn('w-5 h-5', isInstalled ? 'text-blue-600' : 'text-gray-400')} />
            <div className="flex-1">
              <p className={cn(
                'font-medium',
                isInstalled ? 'text-blue-800 dark:text-blue-200' : 'text-gray-600 dark:text-gray-400'
              )}>
                {isInstalled ? 'Installed' : 'Not Installed'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {isInstalled ? 'Running as app' : 'Running in browser'}
              </p>
            </div>
            {canInstall && (
              <button
                onClick={handleInstallPWA}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Install
              </button>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Notifications
          </h4>
          <div className={cn(
            'flex items-center space-x-2 p-3 rounded-lg',
            notificationPermission === 'granted'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800'
          )}>
            {notificationPermission === 'granted' ? 
              <Bell className="w-5 h-5 text-green-600" /> : 
              <BellOff className="w-5 h-5 text-gray-400" />
            }
            <div className="flex-1">
              <p className={cn(
                'font-medium',
                notificationPermission === 'granted' 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-gray-600 dark:text-gray-400'
              )}>
                {notificationPermission === 'granted' ? 'Enabled' : 'Disabled'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {pushSubscription ? 'Push notifications active' : 'No push subscription'}
              </p>
            </div>
            {notificationPermission === 'granted' ? (
              <button
                onClick={handleDisableNotifications}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={handleEnableNotifications}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Sync Status */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Sync Status
          </h4>
          <div className={cn(
            'flex items-center space-x-2 p-3 rounded-lg',
            syncStatus.queueLength === 0
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          )}>
            <Sync className={cn(
              'w-5 h-5',
              syncStatus.syncInProgress && 'animate-spin',
              syncStatus.queueLength === 0 ? 'text-green-600' : 'text-yellow-600'
            )} />
            <div className="flex-1">
              <p className={cn(
                'font-medium',
                syncStatus.queueLength === 0 
                  ? 'text-green-800 dark:text-green-200' 
                  : 'text-yellow-800 dark:text-yellow-200'
              )}>
                {syncStatus.queueLength === 0 ? 'Up to date' : `${syncStatus.queueLength} pending`}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {syncStatus.syncInProgress ? 'Syncing...' : 'Ready to sync'}
              </p>
            </div>
            {syncStatus.queueLength > 0 && isOnline && (
              <button
                onClick={handleManualSync}
                disabled={syncStatus.syncInProgress}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Sync Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Update Available */}
      {isUpdateAvailable && (
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Update Available
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  A new version of the app is ready to install
                </p>
              </div>
            </div>
            <button
              onClick={handleUpdatePWA}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Update Now
            </button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500 dark:text-gray-400">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-auto">
            {JSON.stringify({
              isOnline,
              isInstalled,
              canInstall,
              isUpdateAvailable,
              notificationPermission,
              hasPushSubscription: !!pushSubscription,
              syncStatus
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )
}

// Compact PWA status indicator for headers/footers
export function PWAStatusIndicator({ className }: { className?: string }) {
  const { isOnline } = usePWA()
  const [syncStatus, setSyncStatus] = useState(offlineSyncManager.getSyncStatus())

  useEffect(() => {
    const interval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getSyncStatus())
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full',
        isOnline ? 'bg-green-500' : 'bg-red-500'
      )} />
      {syncStatus.queueLength > 0 && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <Sync className={cn('w-3 h-3', syncStatus.syncInProgress && 'animate-spin')} />
          <span>{syncStatus.queueLength}</span>
        </div>
      )}
    </div>
  )
}