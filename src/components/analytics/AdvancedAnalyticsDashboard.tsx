'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Users,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Zap,
  Brain,
  AlertTriangle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  overview: {
    totalClicks: number
    totalViews: number
    totalRevenue: number
    totalConversions: number
    conversionRate: number
    averageOrderValue: number
    clickThroughRate: number
    revenueGrowth: number
  }
  timeSeriesData: Array<{
    date: string
    clicks: number
    views: number
    revenue: number
    conversions: number
  }>
  topProducts: Array<{
    id: string
    name: string
    clicks: number
    revenue: number
    conversionRate: number
    trend: 'up' | 'down' | 'stable'
  }>
  trafficSources: Array<{
    source: string
    clicks: number
    percentage: number
    color: string
  }>
  predictions: {
    nextWeekRevenue: number
    nextWeekClicks: number
    confidence: number
    trend: 'up' | 'down' | 'stable'
    factors: string[]
  }
  insights: Array<{
    type: 'opportunity' | 'warning' | 'success'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    actionable: boolean
  }>
}

interface AdvancedAnalyticsDashboardProps {
  className?: string
  dateRange?: {
    start: Date
    end: Date
  }
  autoRefresh?: boolean
  refreshInterval?: number
}

export function AdvancedAnalyticsDashboard({
  className,
  dateRange,
  autoRefresh = true,
  refreshInterval = 30000
}: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'clicks' | 'conversions'>('revenue')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'predictions'>('overview')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/advanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: dateRange || {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          }
        })
      })

      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchAnalytics()

    if (autoRefresh) {
      const interval = setInterval(fetchAnalytics, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [dateRange, autoRefresh, refreshInterval])

  // Calculate trend indicators
  const getTrendIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      color: change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
    }
  }

  // Generate predictive insights
  const predictiveInsights = useMemo(() => {
    if (!data) return []

    const insights = []
    
    // Revenue prediction insight
    if (data.predictions.confidence > 0.8) {
      insights.push({
        type: 'success' as const,
        title: 'High Confidence Revenue Prediction',
        description: `Expected revenue of $${data.predictions.nextWeekRevenue.toLocaleString()} next week with ${(data.predictions.confidence * 100).toFixed(0)}% confidence`,
        impact: 'high' as const,
        actionable: true
      })
    }

    // Top performing product insight
    const topProduct = data.topProducts[0]
    if (topProduct && topProduct.trend === 'up') {
      insights.push({
        type: 'opportunity' as const,
        title: 'Rising Star Product',
        description: `${topProduct.name} is trending up with ${topProduct.conversionRate.toFixed(1)}% conversion rate`,
        impact: 'medium' as const,
        actionable: true
      })
    }

    // Low performing products warning
    const lowPerformers = data.topProducts.filter(p => p.conversionRate < 1)
    if (lowPerformers.length > 0) {
      insights.push({
        type: 'warning' as const,
        title: 'Underperforming Products',
        description: `${lowPerformers.length} products have conversion rates below 1%`,
        impact: 'medium' as const,
        actionable: true
      })
    }

    return insights
  }, [data])

  if (loading) {
    return <AnalyticsLoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Advanced Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['overview', 'detailed', 'predictions'] as const).map((mode) => (
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
          
          <Button variant="outline" onClick={fetchAnalytics}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={`$${data.overview.totalRevenue.toLocaleString()}`}
          change={data.overview.revenueGrowth}
          icon={<DollarSign className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Total Clicks"
          value={data.overview.totalClicks.toLocaleString()}
          change={15.2}
          icon={<MousePointer className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${data.overview.conversionRate.toFixed(2)}%`}
          change={-2.1}
          icon={<Target className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          title="Avg Order Value"
          value={`$${data.overview.averageOrderValue.toFixed(2)}`}
          change={8.7}
          icon={<TrendingUp className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Main Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Performance Trends
          </h3>
          <div className="flex space-x-2">
            {(['revenue', 'clicks', 'conversions'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize',
                  selectedMetric === metric
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                )}
              >
                {metric}
              </button>
            ))}
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [
                  selectedMetric === 'revenue' ? `$${value.toLocaleString()}` : value.toLocaleString(),
                  name
                ]}
              />
              <Legend />
              
              {selectedMetric === 'revenue' && (
                <>
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    dot={{ fill: '#1d4ed8', strokeWidth: 2, r: 4 }}
                    name="Revenue Trend"
                  />
                </>
              )}
              
              {selectedMetric === 'clicks' && (
                <Bar
                  dataKey="clicks"
                  fill="#10b981"
                  name="Clicks"
                  radius={[2, 2, 0, 0]}
                />
              )}
              
              {selectedMetric === 'conversions' && (
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 5 }}
                  name="Conversions"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed View */}
      {viewMode === 'detailed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Top Performing Products
            </h3>
            <div className="space-y-4">
              {data.topProducts.slice(0, 5).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.clicks} clicks • {product.conversionRate.toFixed(1)}% conversion
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      ${product.revenue.toLocaleString()}
                    </span>
                    {product.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                    {product.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Traffic Sources */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Traffic Sources
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.trafficSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="clicks"
                  >
                    {data.trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value.toLocaleString(), 'Clicks']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Predictions View */}
      {viewMode === 'predictions' && (
        <div className="space-y-6">
          {/* Prediction Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                    Revenue Prediction
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Next 7 days
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                ${data.predictions.nextWeekRevenue.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                    style={{ width: `${data.predictions.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {(data.predictions.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 dark:text-green-100">
                    Click Prediction
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Next 7 days
                  </p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                {data.predictions.nextWeekClicks.toLocaleString()}
              </div>
              <div className="flex items-center space-x-1">
                {data.predictions.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                {data.predictions.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                <span className="text-sm text-green-700 dark:text-green-300">
                  {data.predictions.trend === 'up' ? 'Increasing' : data.predictions.trend === 'down' ? 'Decreasing' : 'Stable'} trend
                </span>
              </div>
            </Card>

            <Card className="p-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Key Factors
              </h4>
              <div className="space-y-2">
                {data.predictions.factors.map((factor, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {factor}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* AI Insights */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI-Powered Insights
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {predictiveInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
  color: 'green' | 'blue' | 'purple' | 'orange'
}

function MetricCard({ title, value, change, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
          {icon}
        </div>
        <div className={cn('flex items-center space-x-1 text-sm', 
          change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
        )}>
          {change > 0 ? <TrendingUp className="w-4 h-4" /> : change < 0 ? <TrendingDown className="w-4 h-4" /> : null}
          <span>{Math.abs(change).toFixed(1)}%</span>
        </div>
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

// Insight Card Component
interface InsightCardProps {
  insight: {
    type: 'opportunity' | 'warning' | 'success'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    actionable: boolean
  }
}

function InsightCard({ insight }: InsightCardProps) {
  const typeColors = {
    opportunity: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20',
    warning: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    success: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
  }

  const impactColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }

  return (
    <div className={cn('p-4 rounded-lg border', typeColors[insight.type])}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {insight.title}
        </h4>
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', impactColors[insight.impact])}>
          {insight.impact}
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        {insight.description}
      </p>
      {insight.actionable && (
        <Button size="sm" variant="outline" className="text-xs">
          Take Action
        </Button>
      )}
    </div>
  )
}

// Loading Skeleton
function AnalyticsLoadingSkeleton() {
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