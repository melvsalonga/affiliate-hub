'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { usePerformanceMonitor } from '@/lib/performance/monitor'
import { usePWA } from '@/components/providers/PWAProvider'
import { cacheStats } from '@/lib/cache/utils'

interface PerformanceMetrics {
  webVitals: {
    lcp: number
    fcp: number
    cls: number
    ttfb: number
  }
  cacheStats: {
    totalKeys: number
    keysByType: Record<string, number>
  }
  recommendations: string[]
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const { getWebVitals, getReport } = usePerformanceMonitor()
  const { isOnline, clearCache } = usePWA()

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      setLoading(true)
      
      const webVitals = getWebVitals()
      const report = getReport()
      const cache = await cacheStats.getStats()
      
      setMetrics({
        webVitals,
        cacheStats: cache,
        recommendations: report.recommendations
      })
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      await loadMetrics() // Refresh metrics
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          Failed to load performance metrics
        </p>
        <Button onClick={loadMetrics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Performance Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Web Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Largest Contentful Paint"
          value={`${Math.round(metrics.webVitals.lcp)}ms`}
          status={getVitalStatus(metrics.webVitals.lcp, 2500, 4000)}
          description="Time to render the largest content element"
        />
        <MetricCard
          title="First Contentful Paint"
          value={`${Math.round(metrics.webVitals.fcp)}ms`}
          status={getVitalStatus(metrics.webVitals.fcp, 1800, 3000)}
          description="Time to first content render"
        />
        <MetricCard
          title="Cumulative Layout Shift"
          value={metrics.webVitals.cls.toFixed(3)}
          status={getVitalStatus(metrics.webVitals.cls, 0.1, 0.25, true)}
          description="Visual stability score"
        />
        <MetricCard
          title="Time to First Byte"
          value={`${Math.round(metrics.webVitals.ttfb)}ms`}
          status={getVitalStatus(metrics.webVitals.ttfb, 800, 1800)}
          description="Server response time"
        />
      </div>

      {/* Cache Statistics */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cache Statistics
          </h3>
          <Button variant="outline" onClick={handleClearCache}>
            Clear Cache
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metrics.cacheStats.totalKeys}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Cached Items
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="space-y-2">
              {Object.entries(metrics.cacheStats.keysByType).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {type}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Recommendations */}
      {metrics.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Performance Recommendations
          </h3>
          <div className="space-y-3">
            {metrics.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {recommendation}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <Button onClick={loadMetrics}>
          Refresh Metrics
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: string
  status: 'good' | 'needs-improvement' | 'poor'
  description: string
}

function MetricCard({ title, value, status, description }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    'needs-improvement': 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    poor: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
  }

  const statusIcons = {
    good: '✓',
    'needs-improvement': '⚠',
    poor: '✗'
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h4>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${statusColors[status]}`}>
          {statusIcons[status]}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {description}
      </p>
    </Card>
  )
}

function getVitalStatus(
  value: number, 
  goodThreshold: number, 
  poorThreshold: number, 
  reverse = false
): 'good' | 'needs-improvement' | 'poor' {
  if (reverse) {
    if (value <= goodThreshold) return 'good'
    if (value <= poorThreshold) return 'needs-improvement'
    return 'poor'
  } else {
    if (value <= goodThreshold) return 'good'
    if (value <= poorThreshold) return 'needs-improvement'
    return 'poor'
  }
}