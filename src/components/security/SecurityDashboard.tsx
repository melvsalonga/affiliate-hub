'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Globe,
  Clock,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface SecurityMetrics {
  overview: {
    totalEvents: number
    securityViolations: number
    blockedRequests: number
    suspiciousActivity: number
    threatLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  trends: Array<{
    date: string
    violations: number
    blockedRequests: number
    suspiciousActivity: number
    normalRequests: number
  }>
  topThreats: Array<{
    type: string
    count: number
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
  }>
  ipAnalysis: Array<{
    ip: string
    country: string
    requests: number
    violations: number
    riskScore: number
    status: 'allowed' | 'monitored' | 'blocked'
  }>
  userAgentAnalysis: Array<{
    userAgent: string
    requests: number
    violations: number
    category: 'browser' | 'bot' | 'suspicious' | 'unknown'
  }>
  recentEvents: Array<{
    id: string
    timestamp: Date
    type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    source: string
    description: string
    action: string
  }>
}

interface SecurityDashboardProps {
  className?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function SecurityDashboard({ 
  className, 
  autoRefresh = true, 
  refreshInterval = 30000 
}: SecurityDashboardProps) {
  const [data, setData] = useState<SecurityMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')
  const [viewMode, setViewMode] = useState<'overview' | 'threats' | 'analysis'>('overview')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    fetchSecurityData()

    if (autoRefresh) {
      const interval = setInterval(fetchSecurityData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [selectedTimeRange, autoRefresh, refreshInterval])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/security/metrics?timeRange=${selectedTimeRange}`)
      
      if (response.ok) {
        const securityData = await response.json()
        setData(securityData)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportData = () => {
    // Implementation for exporting security data
    console.log('Exporting security data...')
  }

  if (loading && !data) {
    return <SecurityLoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load security data</p>
        <Button onClick={fetchSecurityData} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center space-x-2">
            <Shield className="w-6 h-6" />
            <span>Security Dashboard</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['overview', 'threats', 'analysis'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize',
                  viewMode === mode
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          
          <Button variant="outline" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" onClick={fetchSecurityData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Threat Level Alert */}
      <ThreatLevelAlert level={data.overview.threatLevel} />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SecurityMetricCard
          title="Total Events"
          value={data.overview.totalEvents.toLocaleString()}
          icon={<Activity className="w-5 h-5" />}
          color="blue"
        />
        <SecurityMetricCard
          title="Security Violations"
          value={data.overview.securityViolations.toLocaleString()}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="red"
          trend={-5.2}
        />
        <SecurityMetricCard
          title="Blocked Requests"
          value={data.overview.blockedRequests.toLocaleString()}
          icon={<Shield className="w-5 h-5" />}
          color="orange"
          trend={12.3}
        />
        <SecurityMetricCard
          title="Suspicious Activity"
          value={data.overview.suspiciousActivity.toLocaleString()}
          icon={<Eye className="w-5 h-5" />}
          color="purple"
          trend={-2.1}
        />
      </div>

      {/* Main Content */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Security Trends Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Security Events Trend
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="violations"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                    name="Violations"
                  />
                  <Area
                    type="monotone"
                    dataKey="blockedRequests"
                    stackId="1"
                    stroke="#f97316"
                    fill="#f97316"
                    fillOpacity={0.6}
                    name="Blocked"
                  />
                  <Area
                    type="monotone"
                    dataKey="suspiciousActivity"
                    stackId="1"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                    name="Suspicious"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Security Events */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Security Events
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.recentEvents.map((event) => (
                <SecurityEventCard key={event.id} event={event} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'threats' && (
        <div className="space-y-6">
          {/* Top Threats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Top Security Threats
            </h3>
            <div className="space-y-4">
              {data.topThreats.map((threat, index) => (
                <ThreatCard key={index} threat={threat} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'analysis' && (
        <div className="space-y-6">
          {/* IP Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              IP Address Analysis
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      IP Address
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Country
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Requests
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Violations
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Risk Score
                    </th>
                    <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.ipAnalysis.map((ip, index) => (
                    <IPAnalysisRow key={index} data={ip} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* User Agent Analysis */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              User Agent Analysis
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.userAgentAnalysis}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="requests"
                  >
                    {data.userAgentAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getUserAgentColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Requests']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Threat Level Alert Component
function ThreatLevelAlert({ level }: { level: 'low' | 'medium' | 'high' | 'critical' }) {
  const config = {
    low: {
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      icon: <Shield className="w-5 h-5 text-green-600" />,
      message: 'Security status is normal. No immediate threats detected.'
    },
    medium: {
      color: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
      message: 'Moderate security activity detected. Monitoring recommended.'
    },
    high: {
      color: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
      textColor: 'text-orange-800 dark:text-orange-200',
      icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      message: 'High security activity detected. Review security logs immediately.'
    },
    critical: {
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      message: 'Critical security threats detected. Immediate action required!'
    }
  }

  const { color, textColor, icon, message } = config[level]

  return (
    <div className={cn('p-4 rounded-lg border', color)}>
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <h4 className={cn('font-semibold', textColor)}>
            Threat Level: {level.toUpperCase()}
          </h4>
          <p className={cn('text-sm', textColor)}>
            {message}
          </p>
        </div>
      </div>
    </div>
  )
}

// Security Metric Card Component
interface SecurityMetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'red' | 'orange' | 'purple'
  trend?: number
}

function SecurityMetricCard({ title, value, icon, color, trend }: SecurityMetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn('flex items-center space-x-1 text-sm',
            trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-gray-600'
          )}>
            {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </p>
    </Card>
  )
}

// Security Event Card Component
function SecurityEventCard({ event }: { event: any }) {
  const severityColors = {
    low: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    critical: 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex-shrink-0">
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', severityColors[event.severity])}>
          {event.severity}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {event.type}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {event.timestamp.toLocaleTimeString()}
          </p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {event.description}
        </p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Source: {event.source}
          </p>
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Action: {event.action}
          </p>
        </div>
      </div>
    </div>
  )
}

// Threat Card Component
function ThreatCard({ threat }: { threat: any }) {
  const severityColors = {
    low: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
    medium: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    high: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
    critical: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
  }

  return (
    <div className={cn('p-4 rounded-lg border', severityColors[threat.severity])}>
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {threat.type}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {threat.description}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {threat.count}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            occurrences
          </div>
        </div>
      </div>
    </div>
  )
}

// IP Analysis Row Component
function IPAnalysisRow({ data }: { data: any }) {
  const statusColors = {
    allowed: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    monitored: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    blocked: 'text-red-600 bg-red-100 dark:bg-red-900/30'
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="py-3 px-4 font-mono text-sm text-gray-900 dark:text-gray-100">
        {data.ip}
      </td>
      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
        {data.country}
      </td>
      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
        {data.requests.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
        {data.violations.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-right">
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full',
          data.riskScore > 80 ? 'text-red-600 bg-red-100' :
          data.riskScore > 60 ? 'text-orange-600 bg-orange-100' :
          data.riskScore > 40 ? 'text-yellow-600 bg-yellow-100' :
          'text-green-600 bg-green-100'
        )}>
          {data.riskScore}
        </span>
      </td>
      <td className="py-3 px-4 text-center">
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full capitalize', statusColors[data.status])}>
          {data.status}
        </span>
      </td>
    </tr>
  )
}

// Utility functions
function getUserAgentColor(category: string): string {
  const colors = {
    browser: '#3b82f6',
    bot: '#10b981',
    suspicious: '#ef4444',
    unknown: '#6b7280'
  }
  return colors[category as keyof typeof colors] || colors.unknown
}

// Loading Skeleton
function SecurityLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}