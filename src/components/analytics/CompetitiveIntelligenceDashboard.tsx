'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  AlertTriangleIcon,
  LightBulbIcon,
  EyeIcon,
  RefreshCwIcon,
  PlusIcon,
  BarChart3Icon,
  DollarSignIcon,
  UsersIcon,
  TargetIcon
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

interface Competitor {
  id: string
  name: string
  domain: string
  logoUrl?: string
  analytics?: {
    totalProducts: number
    averagePrice: number
    marketShare: number
  }
  _count: {
    products: number
    priceHistory: number
  }
}

interface MarketTrend {
  id: string
  title: string
  trendType: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  dataPoints: Array<{
    date: string
    value: number
    metadata?: any
  }>
  insights: string[]
  recommendations: string[]
}

interface CompetitiveIntelligence {
  id: string
  title: string
  summary: string
  analysisType: string
  keyFindings: string[]
  opportunities: string[]
  threats: string[]
  recommendations: string[]
  confidenceLevel: number
  impactScore: number
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  createdAt: string
}

interface MarketIntelligenceReport {
  overview: {
    totalCompetitors: number
    totalProducts: number
    averageMarketPrice: number
    priceRange: { min: number; max: number }
  }
  trends: MarketTrend[]
  opportunities: string[]
  threats: string[]
  keyInsights: string[]
}

export default function CompetitiveIntelligenceDashboard() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [intelligence, setIntelligence] = useState<CompetitiveIntelligence[]>([])
  const [marketReport, setMarketReport] = useState<MarketIntelligenceReport | null>(null)
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null)
  const [showAddCompetitor, setShowAddCompetitor] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [competitorsRes, intelligenceRes, marketRes] = await Promise.all([
        fetch('/api/competitors'),
        fetch('/api/competitive-intelligence'),
        fetch('/api/market-intelligence')
      ])

      const [competitorsData, intelligenceData, marketData] = await Promise.all([
        competitorsRes.json(),
        intelligenceRes.json(),
        marketRes.json()
      ])

      setCompetitors(competitorsData.competitors || [])
      setIntelligence(intelligenceData.intelligence || [])
      setMarketReport(marketData)
    } catch (error) {
      console.error('Error loading competitive intelligence data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAnalysis = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/competitors/analyze', { method: 'POST' })
      await loadData()
    } catch (error) {
      console.error('Error refreshing analysis:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'HIGH': return <TrendingUpIcon className="w-4 h-4 text-red-500" />
      case 'MEDIUM': return <TrendingUpIcon className="w-4 h-4 text-yellow-500" />
      case 'LOW': return <TrendingDownIcon className="w-4 h-4 text-green-500" />
      default: return <BarChart3Icon className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h1>
          <p className="text-gray-600">Monitor competitors and analyze market trends</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={refreshAnalysis}
            disabled={refreshing}
            icon={<RefreshCwIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
          >
            {refreshing ? 'Analyzing...' : 'Refresh Analysis'}
          </Button>
          <Button
            onClick={() => setShowAddCompetitor(true)}
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Market Overview */}
      {marketReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Competitors</p>
                <p className="text-2xl font-bold text-gray-900">{marketReport.overview.totalCompetitors}</p>
              </div>
              <UsersIcon className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tracked Products</p>
                <p className="text-2xl font-bold text-gray-900">{marketReport.overview.totalProducts}</p>
              </div>
              <TargetIcon className="w-8 h-8 text-green-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Market Price</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${marketReport.overview.averageMarketPrice.toFixed(2)}
                </p>
              </div>
              <DollarSignIcon className="w-8 h-8 text-purple-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Price Range</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${marketReport.overview.priceRange.min} - ${marketReport.overview.priceRange.max}
                </p>
              </div>
              <BarChart3Icon className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Intelligence Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Intelligence</h3>
            <Badge variant="outline">{intelligence.length} insights</Badge>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {intelligence.slice(0, 5).map((item) => (
              <div key={item.id} className="border-l-4 border-blue-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{item.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{item.summary}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Impact: {item.impactScore}/10
                      </span>
                    </div>
                  </div>
                  {getImpactIcon(item.priority)}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Market Opportunities</h3>
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {marketReport?.opportunities.map((opportunity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <LightBulbIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-green-800">{opportunity}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Competitors Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Competitor Overview</h3>
          <Button variant="outline" size="sm">View All</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCompetitor(competitor)}
            >
              <div className="flex items-center gap-3 mb-3">
                {competitor.logoUrl ? (
                  <img
                    src={competitor.logoUrl}
                    alt={competitor.name}
                    className="w-8 h-8 rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">
                      {competitor.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">{competitor.name}</h4>
                  <p className="text-xs text-gray-500">{competitor.domain}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Products</p>
                  <p className="font-medium">{competitor._count.products}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Price</p>
                  <p className="font-medium">
                    ${competitor.analytics?.averagePrice?.toFixed(2) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Market Trends */}
      {marketReport?.trends && marketReport.trends.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Trends</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {marketReport.trends.slice(0, 2).map((trend) => (
              <div key={trend.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{trend.title}</h4>
                  <div className="flex items-center gap-2">
                    {getImpactIcon(trend.impact)}
                    <Badge variant="outline">{trend.impact}</Badge>
                  </div>
                </div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.dataPoints}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {trend.insights.slice(0, 2).map((insight, index) => (
                    <p key={index} className="text-sm text-gray-600">• {insight}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add Competitor Modal */}
      <AddCompetitorModal
        isOpen={showAddCompetitor}
        onClose={() => setShowAddCompetitor(false)}
        onSuccess={() => {
          setShowAddCompetitor(false)
          loadData()
        }}
      />

      {/* Competitor Detail Modal */}
      {selectedCompetitor && (
        <CompetitorDetailModal
          competitor={selectedCompetitor}
          onClose={() => setSelectedCompetitor(null)}
        />
      )}
    </div>
  )
}

function AddCompetitorModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void 
}) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    logoUrl: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
        setFormData({ name: '', domain: '', description: '', logoUrl: '' })
      }
    } catch (error) {
      console.error('Error adding competitor:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Competitor">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Competitor Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
        <Input
          label="Website Domain"
          type="url"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          placeholder="https://example.com"
          required
        />
        <Input
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
        <Input
          label="Logo URL"
          type="url"
          value={formData.logoUrl}
          onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Competitor
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CompetitorDetailModal({ 
  competitor, 
  onClose 
}: { 
  competitor: Competitor
  onClose: () => void 
}) {
  return (
    <Modal isOpen={true} onClose={onClose} title={competitor.name}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          {competitor.logoUrl ? (
            <img
              src={competitor.logoUrl}
              alt={competitor.name}
              className="w-12 h-12 rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600">
                {competitor.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">{competitor.name}</h3>
            <p className="text-gray-600">{competitor.domain}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{competitor._count.products}</p>
            <p className="text-sm text-gray-600">Products Tracked</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              ${competitor.analytics?.averagePrice?.toFixed(2) || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">Average Price</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            View Details
          </Button>
        </div>
      </div>
    </Modal>
  )
}