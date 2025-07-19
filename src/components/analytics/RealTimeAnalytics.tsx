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
  RefreshCw,
  Zap
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useWebSocket } from '@/hooks/useWebSocket'
import toast from 'react-hot-toast'

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
  const [isPaused, setIsPaused] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [wsConnected, setWsConnected] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout>()

  // WebSocket connection
  const { 
    isConnected: wsIsConnected, 
    isConnecting, 
    error: wsError,
    subscribe,
    unsubscribe,
    lastMessage,
    send
  } = useWebSocket({
    onConnect: () => {
      setWsConnected(true)
      toast.success('Real-time connection established')
    },
    onDisconnect: () => {
      setWsConnected(false)
      toast.error('Real-time connection lost')
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
      toast.error('Real-time connection error')
    }
  })

  // Fetch real-time data (fallback when WebSocket is not available)
  const fetchRealTimeData = async () => {
    if (isPaused) return

    try {
      const response = await fetch('/api/analytics/realtime')
      if (response.ok) {
        const realtimeData = await response.json()
        setLastUpdate(new Date())

        // Update metrics
        setMetrics({
          last24Hours: {
            clicks: realtimeData.clicks,
            conversions: realtimeData.conversions,
            revenue: realtimeData.revenue
          },
          lastHour: {
            clicks: realtimeData.clicks
          },
          timestamp: realtimeData.timestamp
        })

        // Add to time series data
        const newDataPoint: RealTimeData = {
          timestamp: realtimeData.timestamp,
          clicks: realtimeData.clicks,
          conversions: realtimeData.conversions,
          revenue: realtimeData.revenue,
          activeUsers: realtimeData.activeUsers
        }

        setData(prevData => {
          const updatedData = [...prevData, newDataPoint]
          return updatedData.slice(-maxDataPoints)
        })
      }
    } catch (error) {
      console.error('Failed to fetch real-time data:', error)
    }
  }

  // Trigger manual analytics update
  const triggerManualUpdate = async () => {
    try {
      const response = await fetch('/api/analytics/realtime', {
        method: 'PUT'
      })
      
      if (response.ok) {
        toast.success('Analytics update triggered')
      } else {
        toast.error('Failed to trigger update')
      }
    } catch (error) {
      console.error('Failed to trigger manual update:', error)
      toast.error('Failed to trigger update')
    }
  }

  // Subscribe to WebSocket channels
  useEffect(() => {
    if (wsIsConnected) {
      subscribe('analytics')
      subscribe('notifications')
    }

    return () => {
      if (wsIsConnected) {
        unsubscribe('analytics')
        unsubscribe('notifications')
      }
    }
  }, [wsIsConnected, subscribe, unsubscribe])

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.type === 'analytics_update') {
      const analyticsData = lastMessage.data
      setLastUpdate(new Date())

      // Update metrics
      setMetrics({
        last24Hours: {
          clicks: analyticsData.clicks,
          conversions: analyticsData.conversions,
          revenue: analyticsData.revenue
        },
        lastHour: {
          clicks: analyticsData.clicks
        },
        timestamp: analyticsData.timestamp
      })

      // Add to time series data
      const newDataPoint: RealTimeData = {
        timestamp: analyticsData.timestamp,
        clicks: analyticsData.clicks,
        conversions: analyticsData.conversions,
        revenue: analyticsData.revenue,
        activeUsers: analyticsData.activeUsers
      }

      setData(prevData => {
        const updatedData = [...prevData, newDataPoint]
        return updatedData.slice(-maxDataPoints)
      })
    } else if (lastMessage.type === 'notification') {
      const notification = lastMessage.data
      
      // Show toast notification for significant changes
      if (notification.severity === 'success') {
        toast.success(notification.message)
      } else if (notification.severity === 'warning') {
        toast.error(notification.message)
      } else {
        toast(notification.message)
      }
    }
  }, [lastMessage, maxDataPoints])

  // Fallback polling when WebSocket is not connected
  useEffect(() => {
    if (!wsIsConnected && !isPaused) {
      fetchRealTimeData() // Initial fetch
      intervalRef.current = setInterval(fetchRealTimeData, updateInterval)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [wsIsConnected, isPaused, updateInterval])

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
  const isConnected = wsIsConnected || !wsError

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'w-3 h-3 rounded-full',
              wsIsConnected ? 'bg-green-500 animate-pulse' : 
              isConnecting ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
            )} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Real-Time Analytics
            </h2>
          </div>
          <div className="flex items-center space-x-1">
            {wsIsConnected ? (
              <>
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600 font-medium">Live</span>
              </>
            ) : isConnecting ? (
              <>
                <Wifi className="w-4 h-4 text-yellow-600 animate-pulse" />
                <span className="text-xs text-yellow-600 font-medium">Connecting</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600 font-medium">Offline</span>
              </>
            )}
          </div>
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
          <Button
            variant="outline"
            size="sm"
            onClick={triggerManualUpdate}
            title="Trigger manual analytics update"
          >
            <Zap className="w-4 h-4" />
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/analytics/test-event')
                  if (response.ok) {
                    const result = await response.json()
                    toast.success(`Test event: ${result.eventType}`)
                  }
                } catch (error) {
                  toast.error('Failed to trigger test event')
                }
              }}
              title="Trigger test event (dev only)"
            >
              Test
            </Button>
          )}
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
      {!wsIsConnected && (
        <div className={cn(
          'border rounded-lg p-4',
          isConnecting 
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        )}>
          <div className="flex items-center space-x-2">
            {isConnecting ? (
              <Wifi className="w-5 h-5 text-yellow-600 animate-pulse" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
            <span className={cn(
              'font-medium',
              isConnecting 
                ? 'text-yellow-800 dark:text-yellow-200'
                : 'text-red-800 dark:text-red-200'
            )}>
              {isConnecting ? 'Connecting to Real-Time Stream' : 'Real-Time Connection Lost'}
            </span>
          </div>
          <p className={cn(
            'text-sm mt-1',
            isConnecting 
              ? 'text-yellow-700 dark:text-yellow-300'
              : 'text-red-700 dark:text-red-300'
          )}>
            {isConnecting 
              ? 'Establishing WebSocket connection for live updates...'
              : 'Falling back to periodic updates. WebSocket connection will retry automatically.'
            }
          </p>
        </div>
      )}

      {/* WebSocket Status Info */}
      {wsIsConnected && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200 font-medium">
              Real-Time Connection Active
            </span>
          </div>
          <p className="text-green-700 dark:text-green-300 text-sm mt-1">
            Receiving live analytics updates via WebSocket connection.
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