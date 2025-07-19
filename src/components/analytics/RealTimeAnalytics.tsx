'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  ReferenceLine
} from 'recharts'
import { 
  Activity, 
  Users, 
  MousePointer, 
  DollarSign, 
  TrendingUp,
  Wifi,
  WifiOff,
  Pause,
  Play,
  RefreshCw
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface RealTimeData {
  timestamp: string
  clicks: number
  conversions: number
  revenue: number
  activeUsers: number
}

interface RealTimeMetrics {
  last24Hours: {
    clicks: number
    conversions: number
    revenue: number
  }
  lastHour: {
    clicks: number
  }
  timestamp: string
}

interface RealTimeAnalyticsProps {
  className?: string
  updateInterval?: number
  maxDataPoints?: number
}

export function RealTimeAnalytics({ 
  className, 
  updateInterval = 10000, // 10 seconds
  maxDataPoints = 50 
}: RealTimeAnalyticsProps) {
  const [data, setData] = useState<RealTimeData[]>([])
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [isConnected, setIsConnected] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const intervalRef = useRef<NodeJS.Timeout>()

  // Fetch real-time data
  const fetchRealTimeData = async () => {
    if (isPaused) return

    try {
      const response = await fetch('/api/analytics/advanced')
      if (response.ok) {
        const newMetrics = await response.json()
        setMetrics(newMetrics)
        setIsConnected(true)
        setLastUpdate(new Date())

        // Add to time series data
        const newDataPoint: RealTimeData = {
          timestamp: new Date().toISOString(),
          clicks: newMetrics.lastHour.clicks,
          conversions: newMetrics.last24Hours.conversions,
          revenue: newMetrics.last24Hours.revenue,
          activeUsers: Math.floor(Math.random() * 50) + 10 // Simulated active users
        }

        setData(prevData => {
          const updatedData = [...prevData, newDataPoint]
          return updatedData.slice(-maxDataPoints) // Keep only recent data points
        })
      } else {
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error)
      setIsConnected(false)
    }
  }

  // Start/stop real-time updates
  useEffect(() => {
    fetchRealTimeData() // Initial fetch

    if (!isPaused) {
      intervalRef.current = setInterval(fetchRealTimeData, updateInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [updateInterval, isPaused])

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  const handleRefresh = () => {
    fetchRealTimeData()
  }

  // Calculate trends
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return 0
    const recent = values.slice(-5) // Last 5 data points
    const older = values.slice(-10, -5) // Previous 5 data points
    
    if (older.length === 0) return 0
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length
    
    return ((recentAvg - olderAvg) / olderAvg) * 100
  }

  const clickTrend = calculateTrend(data.map(d => d.clicks))
  const revenueTrend = calculateTrend(data.map(d => d.revenue))

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            )} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Real-Time Analytics
            </h2>
          </div>
          {isConnected ? (
            <Wifi className="w-5 h-5 text-green-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-600" />
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className="flex items-center space-x-1"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Real-time Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <RealTimeMetricCard
            title="Clicks (Last Hour)"
            value={metrics.lastHour.clicks}
            trend={clickTrend}
            icon={<MousePointer className="w-5 h-5" />}
            color="blue"
          />
          <RealTimeMetricCard
            title="Revenue (24h)"
            value={`$${metrics.last24Hours.revenue.toLocaleString()}`}
            trend={revenueTrend}
            icon={<DollarSign className="w-5 h-5" />}
            color="green"
          />
          <RealTimeMetricCard
            title="Conversions (24h)"
            value={metrics.last24Hours.conversions}
            trend={0}
            icon={<TrendingUp className="w-5 h-5" />}
            color="purple"
          />
          <RealTimeMetricCard
            title="Active Users"
            value={data.length > 0 ? data[data.length - 1].activeUsers : 0}
            trend={0}
            icon={<Users className="w-5 h-5" />}
            color="orange"
          />
        </div>
      )}

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clicks Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Clicks Over Time
            </h3>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Live
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  formatter={(value: number) => [value, 'Clicks']}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                />
                {data.length > 0 && (
                  <ReferenceLine 
                    y={data.reduce((sum, d) => sum + d.clicks, 0) / data.length} 
                    stroke="#94a3b8" 
                    strokeDasharray="5 5" 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Revenue Trend
            </h3>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Live
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis 
                  dataKey="timestamp"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleTimeString()}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Live Activity Feed
        </h3>
        <ActivityFeed />
      </Card>

      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200 font-medium">
              Connection Lost
            </span>
          </div>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">
            Unable to fetch real-time data. Trying to reconnect...
          </p>
        </div>
      )}
    </div>
  )
}

// Real-time Metric Card
interface RealTimeMetricCardProps {
  title: string
  value: string | number
  trend: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
}

function RealTimeMetricCard({ title, value, trend, icon, color }: RealTimeMetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
  }

  return (
    <Card className="p-4 relative overflow-hidden">
      {/* Pulse animation for live data */}
      <div className="absolute top-2 right-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
      
      <div className="flex items-center space-x-3 mb-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
        {trend !== 0 && (
          <div className={cn('flex items-center space-x-1 text-sm',
            trend > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            <TrendingUp className={cn('w-4 h-4', trend < 0 && 'rotate-180')} />
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </p>
    </Card>
  )
}

// Activity Feed Component
function ActivityFeed() {
  const [activities, setActivities] = useState<Array<{
    id: string
    type: 'click' | 'conversion' | 'view'
    message: string
    timestamp: Date
  }>>([])

  // Simulate real-time activities
  useEffect(() => {
    const generateActivity = () => {
      const types = ['click', 'conversion', 'view'] as const
      const type = types[Math.floor(Math.random() * types.length)]
      
      const messages = {
        click: 'User clicked on affiliate link',
        conversion: 'New conversion recorded',
        view: 'Product page viewed'
      }

      const newActivity = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        message: messages[type],
        timestamp: new Date()
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]) // Keep last 10 activities
    }

    const interval = setInterval(generateActivity, 5000 + Math.random() * 10000) // Random interval
    return () => clearInterval(interval)
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'click': return <MousePointer className="w-4 h-4 text-blue-600" />
      case 'conversion': return <DollarSign className="w-4 h-4 text-green-600" />
      case 'view': return <Activity className="w-4 h-4 text-purple-600" />
      default: return <Activity className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {activities.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">
          Waiting for activity...
        </p>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            {getActivityIcon(activity.type)}
            <div className="flex-1">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {activity.message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {activity.timestamp.toLocaleTimeString()}
              </p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        ))
      )}
    </div>
  )
}