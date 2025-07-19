'use client'

import React, { useState, useEffect } from 'react'
import { 
  FunnelChart, 
  Funnel, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { 
  Users, 
  Eye, 
  MousePointer, 
  ShoppingCart, 
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Target,
  Filter,
  Calendar
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface FunnelStep {
  name: string
  value: number
  fill: string
  icon: React.ReactNode
  description: string
}

interface FunnelData {
  steps: FunnelStep[]
  conversionRates: Array<{
    from: string
    to: string
    rate: number
    dropOff: number
  }>
  userBehavior: {
    averageTimeOnSite: number
    bounceRate: number
    pagesPerSession: number
    returnVisitorRate: number
  }
  segmentAnalysis: Array<{
    segment: string
    visitors: number
    conversions: number
    conversionRate: number
    revenue: number
  }>
  bottlenecks: Array<{
    step: string
    issue: string
    impact: 'high' | 'medium' | 'low'
    recommendation: string
  }>
}

interface ConversionFunnelAnalysisProps {
  className?: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export function ConversionFunnelAnalysis({ 
  className, 
  dateRange 
}: ConversionFunnelAnalysisProps) {
  const [data, setData] = useState<FunnelData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSegment, setSelectedSegment] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'funnel' | 'behavior' | 'segments'>('funnel')

  useEffect(() => {
    fetchFunnelData()
  }, [dateRange, selectedSegment])

  const fetchFunnelData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: dateRange || {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            end: new Date()
          },
          segment: selectedSegment
        })
      })

      if (response.ok) {
        const funnelData = await response.json()
        setData(funnelData)
      }
    } catch (error) {
      console.error('Failed to fetch funnel data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <FunnelLoadingSkeleton />
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Failed to load funnel data</p>
        <Button onClick={fetchFunnelData} className="mt-4">
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
            Conversion Funnel Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track user journey and identify optimization opportunities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['funnel', 'behavior', 'segments'] as const).map((mode) => (
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

      {/* Funnel Overview */}
      {viewMode === 'funnel' && (
        <div className="space-y-6">
          {/* Funnel Visualization */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Conversion Funnel
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Funnel Chart */}
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <FunnelChart>
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(), 
                        name
                      ]}
                    />
                    <Funnel
                      dataKey="value"
                      data={data.steps}
                      isAnimationActive
                    >
                      {data.steps.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              </div>

              {/* Funnel Steps Details */}
              <div className="space-y-4">
                {data.steps.map((step, index) => {
                  const nextStep = data.steps[index + 1]
                  const conversionRate = nextStep 
                    ? ((nextStep.value / step.value) * 100)
                    : 100
                  const dropOffRate = 100 - conversionRate

                  return (
                    <div key={step.name} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center')} style={{ backgroundColor: step.fill + '20', color: step.fill }}>
                          {step.icon}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {step.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {step.value.toLocaleString()}
                        </div>
                        {nextStep && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-green-600">
                              {conversionRate.toFixed(1)}% convert
                            </span>
                            <span className="text-red-600">
                              {dropOffRate.toFixed(1)}% drop
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>

          {/* Conversion Rates */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Step-by-Step Conversion Rates
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.conversionRates}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="from"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
                  />
                  <Bar 
                    dataKey="rate" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Bottlenecks */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Identified Bottlenecks
            </h3>
            <div className="space-y-4">
              {data.bottlenecks.map((bottleneck, index) => (
                <BottleneckCard key={index} bottleneck={bottleneck} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* User Behavior Analysis */}
      {viewMode === 'behavior' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <BehaviorMetricCard
              title="Avg. Time on Site"
              value={`${Math.floor(data.userBehavior.averageTimeOnSite / 60)}m ${data.userBehavior.averageTimeOnSite % 60}s`}
              icon={<Target className="w-5 h-5" />}
              color="blue"
            />
            <BehaviorMetricCard
              title="Bounce Rate"
              value={`${data.userBehavior.bounceRate.toFixed(1)}%`}
              icon={<TrendingDown className="w-5 h-5" />}
              color="red"
            />
            <BehaviorMetricCard
              title="Pages per Session"
              value={data.userBehavior.pagesPerSession.toFixed(1)}
              icon={<Eye className="w-5 h-5" />}
              color="green"
            />
            <BehaviorMetricCard
              title="Return Visitors"
              value={`${data.userBehavior.returnVisitorRate.toFixed(1)}%`}
              icon={<Users className="w-5 h-5" />}
              color="purple"
            />
          </div>

          {/* User Journey Heatmap would go here */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              User Journey Insights
            </h3>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                User journey heatmap and path analysis coming soon
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Segment Analysis */}
      {viewMode === 'segments' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Segment Performance
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Segment
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Visitors
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Conversions
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Conv. Rate
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.segmentAnalysis.map((segment, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {segment.segment}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        {segment.visitors.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        {segment.conversions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          segment.conversionRate > 3 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : segment.conversionRate > 1
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        )}>
                          {segment.conversionRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-gray-100">
                        ${segment.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

// Bottleneck Card Component
interface BottleneckCardProps {
  bottleneck: {
    step: string
    issue: string
    impact: 'high' | 'medium' | 'low'
    recommendation: string
  }
}

function BottleneckCard({ bottleneck }: BottleneckCardProps) {
  const impactColors = {
    high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20',
    medium: 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
  }

  const impactBadgeColors = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  }

  return (
    <div className={cn('p-4 rounded-lg border', impactColors[bottleneck.impact])}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {bottleneck.step}
          </h4>
        </div>
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', impactBadgeColors[bottleneck.impact])}>
          {bottleneck.impact} impact
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
        <strong>Issue:</strong> {bottleneck.issue}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <strong>Recommendation:</strong> {bottleneck.recommendation}
      </p>
    </div>
  )
}

// Behavior Metric Card
interface BehaviorMetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'red' | 'green' | 'purple'
}

function BehaviorMetricCard({ title, value, icon, color }: BehaviorMetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    red: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    green: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorClasses[color])}>
          {icon}
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

// Loading Skeleton
function FunnelLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}