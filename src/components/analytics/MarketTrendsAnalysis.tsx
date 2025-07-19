'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  BarChart3Icon,
  CalendarIcon,
  FilterIcon,
  DownloadIcon,
  AlertCircleIcon,
  LightBulbIcon
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface MarketTrend {
  id: string
  title: string
  description: string
  trendType: 'PRICE' | 'DEMAND' | 'MARKET_SHARE' | 'SEASONAL' | 'COMPETITIVE' | 'TECHNOLOGY' | 'CONSUMER_BEHAVIOR'
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  dataPoints: Array<{
    date: string
    value: number
    metadata?: any
  }>
  insights: string[]
  recommendations: string[]
  startDate: string
  endDate?: string
  category?: {
    name: string
    slug: string
  }
}

interface TrendFilter {
  trendType?: string
  impact?: string
  categoryId?: string
  dateRange?: string
}

const TREND_COLORS = {
  PRICE: '#3b82f6',
  DEMAND: '#10b981',
  MARKET_SHARE: '#f59e0b',
  SEASONAL: '#8b5cf6',
  COMPETITIVE: '#ef4444',
  TECHNOLOGY: '#06b6d4',
  CONSUMER_BEHAVIOR: '#f97316'
}

const IMPACT_COLORS = {
  HIGH: 'bg-red-100 text-red-800 border-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW: 'bg-green-100 text-green-800 border-green-200'
}

export default function MarketTrendsAnalysis() {
  const [trends, setTrends] = useState<MarketTrend[]>([])
  const [selectedTrend, setSelectedTrend] = useState<MarketTrend | null>(null)
  const [filters, setFilters] = useState<TrendFilter>({})
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadTrends()
  }, [filters])

  const loadTrends = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.trendType) params.append('trendType', filters.trendType)
      if (filters.impact) params.append('impact', filters.impact)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)

      const response = await fetch(`/api/market-trends?${params}`)
      const data = await response.json()
      
      setTrends(data.trends || [])
    } catch (error) {
      console.error('Error loading market trends:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case 'PRICE':
      case 'DEMAND':
        return <TrendingUpIcon className="w-5 h-5" />
      case 'MARKET_SHARE':
      case 'COMPETITIVE':
        return <BarChart3Icon className="w-5 h-5" />
      default:
        return <TrendingUpIcon className="w-5 h-5" />
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return <AlertCircleIcon className="w-4 h-4 text-red-500" />
      case 'MEDIUM':
        return <AlertCircleIcon className="w-4 h-4 text-yellow-500" />
      case 'LOW':
        return <AlertCircleIcon className="w-4 h-4 text-green-500" />
      default:
        return <AlertCircleIcon className="w-4 h-4 text-gray-500" />
    }
  }

  const formatTrendData = (trend: MarketTrend) => {
    return trend.dataPoints.map(point => ({
      ...point,
      date: new Date(point.date).toLocaleDateString(),
      timestamp: point.date
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const exportTrends = async () => {
    try {
      const response = await fetch('/api/market-trends/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
      })
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `market-trends-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting trends:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Market Trends Analysis</h2>
          <p className="text-gray-600">Analyze market trends and identify opportunities</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            icon={<FilterIcon className="w-4 h-4" />}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={exportTrends}
            icon={<DownloadIcon className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trend Type
              </label>
              <select
                value={filters.trendType || ''}
                onChange={(e) => setFilters({ ...filters, trendType: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="PRICE">Price</option>
                <option value="DEMAND">Demand</option>
                <option value="MARKET_SHARE">Market Share</option>
                <option value="SEASONAL">Seasonal</option>
                <option value="COMPETITIVE">Competitive</option>
                <option value="TECHNOLOGY">Technology</option>
                <option value="CONSUMER_BEHAVIOR">Consumer Behavior</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Impact Level
              </label>
              <select
                value={filters.impact || ''}
                onChange={(e) => setFilters({ ...filters, impact: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Impacts</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={filters.dateRange || ''}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setFilters({})}
                variant="outline"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Trends Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Trends</p>
              <p className="text-2xl font-bold text-gray-900">{trends.length}</p>
            </div>
            <BarChart3Icon className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Impact</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.filter(t => t.impact === 'HIGH').length}
              </p>
            </div>
            <AlertCircleIcon className="w-8 h-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.length > 0 
                  ? Math.round((trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length) * 100)
                  : 0}%
              </p>
            </div>
            <TrendingUpIcon className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Trends</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.filter(t => !t.endDate || new Date(t.endDate) > new Date()).length}
              </p>
            </div>
            <CalendarIcon className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Trends Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trends.map((trend) => (
          <Card key={trend.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getTrendIcon(trend.trendType)}
                  <div>
                    <h4 className="font-medium text-gray-900">{trend.title}</h4>
                    <p className="text-sm text-gray-600">{trend.trendType.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getImpactIcon(trend.impact)}
                  <Badge className={IMPACT_COLORS[trend.impact]}>
                    {trend.impact}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{trend.description}</p>

              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatTrendData(trend)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={TREND_COLORS[trend.trendType] || '#3b82f6'}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <span className="text-xs font-medium text-gray-700">
                    {Math.round(trend.confidence * 100)}%
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTrend(trend)}
                >
                  View Details
                </Button>
              </div>

              {trend.insights.length > 0 && (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 mb-2">
                    <LightBulbIcon className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Key Insight</span>
                  </div>
                  <p className="text-sm text-gray-600">{trend.insights[0]}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Trend Detail Modal */}
      {selectedTrend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTrend.title}</h3>
                  <p className="text-gray-600">{selectedTrend.description}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTrend(null)}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge className={IMPACT_COLORS[selectedTrend.impact]}>
                    {selectedTrend.impact} IMPACT
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Impact Level</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(selectedTrend.confidence * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Confidence</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedTrend.dataPoints.length}
                  </p>
                  <p className="text-sm text-gray-600">Data Points</p>
                </div>
              </div>

              <div className="h-64 mb-6">
                <h4 className="font-medium text-gray-900 mb-4">Trend Analysis</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatTrendData(selectedTrend)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={TREND_COLORS[selectedTrend.trendType] || '#3b82f6'}
                      strokeWidth={3}
                      dot={{ fill: TREND_COLORS[selectedTrend.trendType] || '#3b82f6', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
                  <div className="space-y-2">
                    {selectedTrend.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <LightBulbIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-600">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recommendations</h4>
                  <div className="space-y-2">
                    {selectedTrend.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-xs text-blue-600 font-medium">{index + 1}</span>
                        </div>
                        <p className="text-sm text-gray-600">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedTrend(null)}>
                  Close
                </Button>
                <Button>
                  Create Action Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}