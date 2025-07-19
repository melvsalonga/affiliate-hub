'use client'

import React, { useState, useEffect } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Sync, 
  Check, 
  AlertCircle, 
  Clock, 
  Database,
  RefreshCw,
  X
} from 'lucide-react'
import { offlineSyncManager, offlineDataManager } from '@/lib/offline/sync-manager'
import { TouchButton } from '@/components/mobile/TouchInteractions'
import { cn } from '@/lib/utils'

interface OfflineSyncStatusProps {
  className?: string
  variant?: 'compact' | 'detailed' | 'banner'
  showActions?: boolean
}

export function OfflineSyncStatus({ 
  className, 
  variant = 'compact',
  showActions = true 
}: OfflineSyncStatusProps) {
  const [syncStatus, setSyncStatus] = useState(offlineSyncManager.getSyncStatus())
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [queuedActions, setQueuedActions] = useState<any[]>([])
  const [isManualSyncing, setIsManualSyncing] = useState(false)

  useEffect(() => {
    // Update sync status periodically
    const interval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getSyncStatus())
      setQueuedActions(offlineSyncManager.getQueuedActions())
    }, 1000)

    // Listen for sync events
    const handleSyncCompleted = (event: CustomEvent) => {
      setLastSync(new Date())
      setSyncStatus(offlineSyncManager.getSyncStatus())
      setIsManualSyncing(false)
    }

    const handleOnlineStatusChange = () => {
      setSyncStatus(offlineSyncManager.getSyncStatus())
    }

    window.addEventListener('sync-completed', handleSyncCompleted as EventListener)
    window.addEventListener('online', handleOnlineStatusChange)
    window.addEventListener('offline', handleOnlineStatusChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener('sync-completed', handleSyncCompleted as EventListener)
      window.removeEventListener('online', handleOnlineStatusChange)
      window.removeEventListener('offline', handleOnlineStatusChange)
    }
  }, [])

  const handleManualSync = async () => {
    if (!syncStatus.isOnline || syncStatus.syncInProgress) return
    
    setIsManualSyncing(true)
    try {
      await offlineSyncManager.syncAll()
    } catch (error) {
      console.error('Manual sync failed:', error)
      setIsManualSyncing(false)
    }
  }

  const handleClearQueue = () => {
    offlineSyncManager.clearQueue()
    setSyncStatus(offlineSyncManager.getSyncStatus())
    setQueuedActions([])
  }

  const handleClearCache = () => {
    offlineDataManager.clearCache()
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {/* Connection Status */}
        <div className={cn(
          'flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
          syncStatus.isOnline 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        )}>
          {syncStatus.isOnline ? (
            <Wifi className="w-3 h-3" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span>{syncStatus.isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Sync Queue */}
        {syncStatus.queueLength > 0 && (
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <Sync className={cn('w-3 h-3', syncStatus.syncInProgress && 'animate-spin')} />
            <span>{syncStatus.queueLength}</span>
          </div>
        )}

        {/* Manual Sync Button */}
        {showActions && syncStatus.queueLength > 0 && syncStatus.isOnline && (
          <TouchButton
            size="sm"
            variant="ghost"
            onClick={handleManualSync}
            disabled={syncStatus.syncInProgress || isManualSyncing}
            className="p-1"
          >
            <RefreshCw className={cn('w-3 h-3', (syncStatus.syncInProgress || isManualSyncing) && 'animate-spin')} />
          </TouchButton>
        )}
      </div>
    )
  }

  if (variant === 'banner' && (!syncStatus.isOnline || syncStatus.queueLength > 0)) {
    return (
      <div className={cn(
        'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4',
        !syncStatus.isOnline && 'bg-red-50 dark:bg-red-900/20 border-red-400',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {syncStatus.isOnline ? (
              <Sync className={cn('w-5 h-5 text-yellow-600', syncStatus.syncInProgress && 'animate-spin')} />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <div>
              <p className={cn(
                'font-medium',
                syncStatus.isOnline ? 'text-yellow-800 dark:text-yellow-200' : 'text-red-800 dark:text-red-200'
              )}>
                {syncStatus.isOnline 
                  ? `${syncStatus.queueLength} actions pending sync`
                  : 'You are offline'
                }
              </p>
              <p className={cn(
                'text-sm',
                syncStatus.isOnline ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'
              )}>
                {syncStatus.isOnline 
                  ? 'Your actions will sync automatically'
                  : 'Actions will sync when connection returns'
                }
              </p>
            </div>
          </div>

          {showActions && syncStatus.isOnline && syncStatus.queueLength > 0 && (
            <TouchButton
              size="sm"
              onClick={handleManualSync}
              disabled={syncStatus.syncInProgress || isManualSyncing}
            >
              {syncStatus.syncInProgress || isManualSyncing ? 'Syncing...' : 'Sync Now'}
            </TouchButton>
          )}
        </div>
      </div>
    )
  }

  // Detailed variant
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Sync Status</span>
        </h3>
        
        {showActions && (
          <div className="flex space-x-2">
            {syncStatus.queueLength > 0 && (
              <TouchButton
                size="sm"
                variant="outline"
                onClick={handleClearQueue}
                className="text-xs"
              >
                Clear Queue
              </TouchButton>
            )}
            <TouchButton
              size="sm"
              variant="outline"
              onClick={handleClearCache}
              className="text-xs"
            >
              Clear Cache
            </TouchButton>
          </div>
        )}
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={cn(
          'flex items-center space-x-3 p-3 rounded-lg',
          syncStatus.isOnline 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        )}>
          {syncStatus.isOnline ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
          <div>
            <p className={cn(
              'font-medium',
              syncStatus.isOnline ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            )}>
              {syncStatus.isOnline ? 'Online' : 'Offline'}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {syncStatus.isOnline ? 'All features available' : 'Limited functionality'}
            </p>
          </div>
        </div>

        <div className={cn(
          'flex items-center space-x-3 p-3 rounded-lg',
          syncStatus.queueLength === 0
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        )}>
          <Sync className={cn(
            'w-5 h-5',
            syncStatus.syncInProgress && 'animate-spin',
            syncStatus.queueLength === 0 ? 'text-green-600' : 'text-yellow-600'
          )} />
          <div>
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
        </div>
      </div>

      {/* Last Sync */}
      {lastSync && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
          <Clock className="w-4 h-4" />
          <span>Last sync: {lastSync.toLocaleString()}</span>
        </div>
      )}

      {/* Manual Sync */}
      {syncStatus.queueLength > 0 && syncStatus.isOnline && (
        <div className="flex space-x-2">
          <TouchButton
            onClick={handleManualSync}
            disabled={syncStatus.syncInProgress || isManualSyncing}
            className="flex-1"
          >
            {syncStatus.syncInProgress || isManualSyncing ? (
              <>
                <Sync className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </TouchButton>
        </div>
      )}

      {/* Queued Actions Details */}
      {queuedActions.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
            View Queued Actions ({queuedActions.length})
          </summary>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {queuedActions.slice(0, 10).map((action) => (
              <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                <div>
                  <span className="font-medium">{action.type}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {action.retryCount > 0 && (
                    <span className="text-orange-600 dark:text-orange-400">
                      Retry {action.retryCount}/{action.maxRetries}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {queuedActions.length > 10 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                ... and {queuedActions.length - 10} more
              </p>
            )}
          </div>
        </details>
      )}

      {/* No Pending Actions */}
      {syncStatus.queueLength === 0 && (
        <div className="text-center py-4">
          <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All actions are synced
          </p>
        </div>
      )}
    </div>
  )
}

// Floating sync indicator for mobile
export function FloatingSyncIndicator({ className }: { className?: string }) {
  const [syncStatus, setSyncStatus] = useState(offlineSyncManager.getSyncStatus())
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const status = offlineSyncManager.getSyncStatus()
      setSyncStatus(status)
      setIsVisible(!status.isOnline || status.queueLength > 0)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 flex items-center space-x-2 px-3 py-2 rounded-full shadow-lg',
      syncStatus.isOnline 
        ? 'bg-yellow-500 text-white'
        : 'bg-red-500 text-white',
      className
    )}>
      {syncStatus.isOnline ? (
        <Sync className={cn('w-4 h-4', syncStatus.syncInProgress && 'animate-spin')} />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">
        {syncStatus.isOnline 
          ? `${syncStatus.queueLength} pending`
          : 'Offline'
        }
      </span>
    </div>
  )
}