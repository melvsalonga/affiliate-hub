'use client'

import React, { useState, useEffect } from 'react'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Search, 
  Star, 
  DollarSign,
  Users,
  Globe,
  AlertTriangle,
  Target,
  Zap,
  Award
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface CompetitorData {
  name: string
  domain: string
  marketShare: number
  averagePrice: number
  productCount: number
  trafficEstimate: number
  conversionRate: number
  customerRating: number
  strengths: string[]
  weaknesses: string[]
  topProducts: Array<{
    name: string
    price: number
    rating: number
    sales: number
  }>
}

interface MarketIntelligence {
  competitors: CompetitorData[]
  marketTrends: Array<{
    month: string
    ourPerformance: number
    marketAverage: number
    topCompetitor: number
  }>
  opportunityAreas: Array<{
    category: string
    marketGap: number
    difficulty: 'low' | 'medium' | 'high'
    potential: number
    description: string
  }>
  benchmarks: {
    conversionRate: { us: number; average: number; best: number }
    averageOrderValue: { us: number; average: number; best: number }
    customerSatisfaction: { us: number; average: number; best: number }
    marketShare: { us: number; target: number }
  }
}

interface CompetitorAnalysisProps {
  className?: string
}

export function CompetitorAnalysis({ className }: CompetitorAnalysisProps) {
  const [data, setData] = useState<MarketIntelligence | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('')
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'opportunities'>('overview')

  useEffect(() => {
    fetchCompetitorData()
  }, [])

  const fetchCompetitorData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/competitors')
      
      if (response.ok) {
        const competitorData = await response.json()
        setData(competitorData)
        if (competitorData.competitors.length > 0) {
          setSelectedCompetitor(competitorData.competitors[0].name)
        }
      }
    } catch (error) {
      console.error('Failed to fetch competitor data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <CompetitorLoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load competitor data</p>
        <Button onClick={fetchCompetitorData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const selectedCompetitorData = data.competitors.find(c => c.name === selectedCompetitor)

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Competitor Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Market intelligence and competitive benchmarking
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['overview', 'detailed', 'opportunities'] as const).map((mode) => (
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
        </div>
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Market Position */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Market Position
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Market Share Chart */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Market Share Distribution
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.competitors.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value}%`, 'Market Share']}
                      />
                      <Bar 
                        dataKey="marketShare" 
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance Radar */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Performance Comparison
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { metric: 'Conversion Rate', us: data.benchmarks.conversionRate.us, average: data.benchmarks.conversionRate.average },
                      { metric: 'AOV', us: data.benchmarks.averageOrderValue.us / 10, average: data.benchmarks.averageOrderValue.average / 10 },
                      { metric: 'Satisfaction', us: data.benchmarks.customerSatisfaction.us, average: data.benchmarks.customerSatisfaction.average },
                      { metric: 'Market Share', us: data.benchmarks.marketShare.us, average: 20 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fontSize: 10 }} />
                      <Radar name="Us" dataKey="us" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Market Avg" dataKey="average" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Trends */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Performance Trends
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.marketTrends}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="ourPerformance" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Our Performance"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="marketAverage" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Market Average"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="topCompetitor" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Top Competitor"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Key Benchmarks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BenchmarkCard
              title="Conversion Rate"
              ourValue={`${data.benchmarks.conversionRate.us.toFixed(1)}%`}
              marketAverage={`${data.benchmarks.conversionRate.average.toFixed(1)}%`}
              bestInClass={`${data.benchmarks.conversionRate.best.toFixed(1)}%`}
              trend={data.benchmarks.conversionRate.us > data.benchmarks.conversionRate.average ? 'up' : 'down'}
              icon={<Target className="w-5 h-5" />}
            />
            <BenchmarkCard
              title="Avg Order Value"
              ourValue={`$${data.benchmarks.averageOrderValue.us.toFixed(0)}`}
              marketAverage={`$${data.benchmarks.averageOrderValue.average.toFixed(0)}`}
              bestInClass={`$${data.benchmarks.averageOrderValue.best.toFixed(0)}`}
              trend={data.benchmarks.averageOrderValue.us > data.benchmarks.averageOrderValue.average ? 'up' : 'down'}
              icon={<DollarSign className="w-5 h-5" />}
            />
            <BenchmarkCard
              title="Customer Rating"
              ourValue={`${data.benchmarks.customerSatisfaction.us.toFixed(1)}/5`}
              marketAverage={`${data.benchmarks.customerSatisfaction.average.toFixed(1)}/5`}
              bestInClass={`${data.benchmarks.customerSatisfaction.best.toFixed(1)}/5`}
              trend={data.benchmarks.customerSatisfaction.us > data.benchmarks.customerSatisfaction.average ? 'up' : 'down'}
              icon={<Star className="w-5 h-5" />}
            />
            <BenchmarkCard
              title="Market Share"
              ourValue={`${data.benchmarks.marketShare.us.toFixed(1)}%`}
              marketAverage="N/A"
              bestInClass={`${data.benchmarks.marketShare.target.toFixed(1)}%`}
              trend={data.benchmarks.marketShare.us < data.benchmarks.marketShare.target ? 'down' : 'up'}
              icon={<Globe className="w-5 h-5" />}
            />
          </div>
        </div>
      )}

      {/* Detailed Analysis */}
      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* Competitor Selection */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Detailed Competitor Analysis
              </h3>
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                {data.competitors.map((competitor) => (
                  <option key={competitor.name} value={competitor.name}>
                    {competitor.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCompetitorData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Competitor Overview */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    {selectedCompetitorData.name} Overview
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Domain</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedCompetitorData.domain}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Market Share</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedCompetitorData.marketShare}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Avg Price</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        ${selectedCompetitorData.averagePrice}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Products</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedCompetitorData.productCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-400">Est. Traffic</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedCompetitorData.trafficEstimate.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                    Strengths & Weaknesses
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                        Strengths
                      </h5>
                      <div className="space-y-2">
                        {selectedCompetitorData.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {strength}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                        Weaknesses
                      </h5>
                      <div className="space-y-2">
                        {selectedCompetitorData.weaknesses.map((weakness, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {weakness}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Top Products Comparison */}
          {selectedCompetitorData && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {selectedCompetitorData.name} - Top Products
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Product
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Price
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Rating
                      </th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                        Est. Sales
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedCompetitorData.topProducts.map((product, index) => (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                          {product.name}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                          ${product.price}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-gray-900 dark:text-gray-100">
                              {product.rating}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                          {product.sales.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Opportunities */}
      {viewMode === 'opportunities' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Market Opportunities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.opportunityAreas.map((opportunity, index) => (
                <OpportunityCard key={index} opportunity={opportunity} />
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Benchmark Card Component
interface BenchmarkCardProps {
  title: string
  ourValue: string
  marketAverage: string
  bestInClass: string
  trend: 'up' | 'down'
  icon: React.ReactNode
}

function BenchmarkCard({ title, ourValue, marketAverage, bestInClass, trend, icon }: BenchmarkCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className={cn('flex items-center space-x-1',
          trend === 'up' ? 'text-green-600' : 'text-red-600'
        )}>
          {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        </div>
      </div>
      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
        {title}
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Us:</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{ourValue}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Market Avg:</span>
          <span className="text-gray-900 dark:text-gray-100">{marketAverage}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Best:</span>
          <span className="text-gray-900 dark:text-gray-100">{bestInClass}</span>
        </div>
      </div>
    </Card>
  )
}

// Opportunity Card Component
interface OpportunityCardProps {
  opportunity: {
    category: string
    marketGap: number
    difficulty: 'low' | 'medium' | 'high'
    potential: number
    description: string
  }
}

function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const difficultyColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  }

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-gray-100">
          {opportunity.category}
        </h4>
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', difficultyColors[opportunity.difficulty])}>
          {opportunity.difficulty} difficulty
        </span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {opportunity.description}
      </p>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600 dark:text-gray-400">Market Gap:</span>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {opportunity.marketGap}%
          </div>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-400">Potential:</span>
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            ${opportunity.potential.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading Skeleton
function CompetitorLoadingSkeleton() {
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