'use client'

import React, { useState, useEffect } from 'react'
import { Metadata } from 'next'
import { WifiOff, RefreshCw, Home, Search, Database, Sync, Clock } from 'lucide-react'
import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import { Button } from '@/components/ui/Button'
import { offlineDataManager, offlineSyncManager } from '@/lib/offline/sync-manager'
import { PWAStatusIndicator } from '@/components/pwa/PWAStatus'

export default function OfflinePage() {
  const [cachedData, setCachedData] = useState<any[]>([])
  const [syncStatus, setSyncStatus] = useState(offlineSyncManager.getSyncStatus())
  const [lastSync, setLastSync] = useState<Date | null>(null)

  useEffect(() => {
    // Load cached products for offline browsing
    loadCachedData()
    
    // Update sync status
    const interval = setInterval(() => {
      setSyncStatus(offlineSyncManager.getSyncStatus())
    }, 1000)

    // Listen for sync events
    const handleSyncCompleted = () => {
      setLastSync(new Date())
      setSyncStatus(offlineSyncManager.getSyncStatus())
    }

    window.addEventListener('sync-completed', handleSyncCompleted)

    return () => {
      clearInterval(interval)
      window.removeEventListener('sync-completed', handleSyncCompleted)
    }
  }, [])

  const loadCachedData = () => {
    // Try to load cached products
    const products = offlineDataManager.getCachedData('/api/products')
    if (products && products.products) {
      setCachedData(products.products.slice(0, 6)) // Show first 6 products
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  const handleManualSync = async () => {
    await offlineSyncManager.syncAll()
  }

  return (
    <Container className="min-h-screen flex items-center justify-center py-8">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-500 dark:bg-red-600 text-white p-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <WifiOff className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
          <p className="text-red-100">
            No internet connection detected. You can still access cached content and your actions will sync when you're back online.
          </p>
          <div className="mt-4 flex justify-center">
            <PWAStatusIndicator />
          </div>
        </div>

        <div className="p-6">
          {/* Action Buttons */}
          <div className="space-y-4 mb-6">
            <Button
              onClick={handleRefresh}
              className="w-full flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Check Connection</span>
            </Button>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                asChild
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Link href="/">
                  <Home className="w-5 h-5" />
                  <span>Home</span>
                </Link>
              </Button>

              <Button
                variant="outline"
                asChild
                className="flex-1 flex items-center justify-center space-x-2"
              >
                <Link href="/products">
                  <Search className="w-5 h-5" />
                  <span>Browse</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Sync Status */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                <Sync className={`w-5 h-5 ${syncStatus.syncInProgress ? 'animate-spin' : ''}`} />
                <span>Sync Status</span>
              </h3>
              {syncStatus.queueLength > 0 && (
                <Button
                  size="sm"
                  onClick={handleManualSync}
                  disabled={syncStatus.syncInProgress}
                >
                  Sync Now
                </Button>
              )}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Pending actions:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {syncStatus.queueLength}
                </span>
              </div>
              {lastSync && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last sync:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{lastSync.toLocaleTimeString()}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Offline Features */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Available Offline:</span>
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Browse cached products and categories</li>
              <li>• View saved favorites and wishlists</li>
              <li>• Access recent searches and history</li>
              <li>• Read offline content and articles</li>
              <li>• Actions will sync when connection returns</li>
            </ul>
          </div>

          {/* Cached Products Preview */}
          {cachedData.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Recently Viewed Products
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {cachedData.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    className="block bg-gray-50 dark:bg-gray-700 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].url}
                        alt={product.title}
                        className="w-full h-20 object-cover rounded mb-2"
                      />
                    )}
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                      {product.title}
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      {product.currency}{product.currentPrice}
                    </p>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/products"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  View All Cached Products →
                </Link>
              </div>
            </div>
          )}

          {/* No Cached Data */}
          {cachedData.length === 0 && (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No cached content available. Browse the site while online to cache content for offline viewing.
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  )
}