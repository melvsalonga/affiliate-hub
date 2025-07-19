'use client'

import React from 'react'
import { Container } from '@/components/layout/Container'
import { PWAStatus } from '@/components/pwa/PWAStatus'
import { PushNotificationManager } from '@/components/pwa/PushNotificationManager'
import { OfflineSyncStatus } from '@/components/pwa/OfflineSyncStatus'
import { PWAInstallPrompt } from '@/components/pwa/PWAInstallPrompt'
import { usePWA } from '@/components/providers/PWAProvider'
import { 
  Smartphone, 
  Settings, 
  Download, 
  Bell, 
  Database, 
  Zap,
  Shield,
  HardDrive,
  Wifi
} from 'lucide-react'

export default function PWASettingsPage() {
  const { isInstalled, canInstall, clearCache } = usePWA()

  const handleClearAllData = async () => {
    if (confirm('This will clear all cached data and reset the app. Continue?')) {
      await clearCache()
      // Clear all localStorage
      localStorage.clear()
      // Reload the page
      window.location.reload()
    }
  }

  return (
    <Container className="py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              PWA Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Progressive Web App experience
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* PWA Status Overview */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              App Status
            </h2>
          </div>
          <PWAStatus showDetails={true} />
        </section>

        {/* Installation */}
        {!isInstalled && canInstall && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Install App
              </h2>
            </div>
            <PWAInstallPrompt variant="card" autoShow={false} />
          </section>
        )}

        {/* Push Notifications */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Push Notifications
            </h2>
          </div>
          <PushNotificationManager showPreferences={true} />
        </section>

        {/* Offline & Sync */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Database className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Offline & Sync
            </h2>
          </div>
          <OfflineSyncStatus variant="detailed" showActions={true} />
        </section>

        {/* Performance & Storage */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Performance & Storage
            </h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Storage Usage */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                  <HardDrive className="w-4 h-4" />
                  <span>Storage Usage</span>
                </h3>
                <StorageUsage />
              </div>

              {/* Performance Metrics */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Performance</span>
                </h3>
                <PerformanceMetrics />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={clearCache}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear Cache
                </button>
                <button
                  onClick={handleClearAllData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset App Data
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PWA Features */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              PWA Features
            </h2>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureStatus
                icon={<Wifi className="w-5 h-5" />}
                title="Offline Support"
                description="Browse cached content when offline"
                status="enabled"
              />
              <FeatureStatus
                icon={<Bell className="w-5 h-5" />}
                title="Push Notifications"
                description="Receive price alerts and updates"
                status={Notification.permission === 'granted' ? 'enabled' : 'disabled'}
              />
              <FeatureStatus
                icon={<Download className="w-5 h-5" />}
                title="App Installation"
                description="Install as native app"
                status={isInstalled ? 'enabled' : canInstall ? 'available' : 'unavailable'}
              />
              <FeatureStatus
                icon={<Database className="w-5 h-5" />}
                title="Background Sync"
                description="Sync data when connection returns"
                status="enabled"
              />
            </div>
          </div>
        </section>

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <section>
            <details className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <summary className="cursor-pointer font-medium text-gray-900 dark:text-gray-100">
                Debug Information
              </summary>
              <DebugInfo />
            </details>
          </section>
        )}
      </div>
    </Container>
  )
}

// Storage usage component
function StorageUsage() {
  const [usage, setUsage] = React.useState<any>(null)

  React.useEffect(() => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(setUsage)
    }
  }, [])

  if (!usage) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Storage information not available
      </div>
    )
  }

  const usedMB = Math.round((usage.usage || 0) / 1024 / 1024)
  const quotaMB = Math.round((usage.quota || 0) / 1024 / 1024)
  const percentage = quotaMB > 0 ? Math.round((usedMB / quotaMB) * 100) : 0

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Used</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {usedMB} MB of {quotaMB} MB
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {percentage}% used
      </div>
    </div>
  )
}

// Performance metrics component
function PerformanceMetrics() {
  const [metrics, setMetrics] = React.useState<any>(null)

  React.useEffect(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        setMetrics({
          loadTime: Math.round(navigation.loadEventEnd - navigation.navigationStart),
          domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
          firstPaint: Math.round(navigation.responseStart - navigation.navigationStart)
        })
      }
    }
  }, [])

  if (!metrics) {
    return (
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Performance metrics not available
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Page Load</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {metrics.loadTime}ms
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">DOM Ready</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {metrics.domContentLoaded}ms
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">First Paint</span>
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {metrics.firstPaint}ms
        </span>
      </div>
    </div>
  )
}

// Feature status component
function FeatureStatus({ 
  icon, 
  title, 
  description, 
  status 
}: { 
  icon: React.ReactNode
  title: string
  description: string
  status: 'enabled' | 'disabled' | 'available' | 'unavailable'
}) {
  const statusColors = {
    enabled: 'text-green-600 dark:text-green-400',
    available: 'text-blue-600 dark:text-blue-400',
    disabled: 'text-gray-400',
    unavailable: 'text-red-600 dark:text-red-400'
  }

  const statusLabels = {
    enabled: 'Enabled',
    available: 'Available',
    disabled: 'Disabled',
    unavailable: 'Unavailable'
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="text-gray-600 dark:text-gray-400 mt-1">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {title}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
        <span className={`text-sm font-medium ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  )
}

// Debug information component
function DebugInfo() {
  const { isOnline, isInstalled, canInstall, notificationPermission } = usePWA()

  const debugData = {
    userAgent: navigator.userAgent,
    isOnline,
    isInstalled,
    canInstall,
    notificationPermission,
    serviceWorkerSupported: 'serviceWorker' in navigator,
    pushSupported: 'PushManager' in window,
    notificationSupported: 'Notification' in window,
    storageSupported: 'storage' in navigator,
    url: window.location.href,
    timestamp: new Date().toISOString()
  }

  return (
    <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
      {JSON.stringify(debugData, null, 2)}
    </pre>
  )
}