'use client'

import React, { useState } from 'react'
import { Container } from '@/components/layout/Container'
import { AdvancedAnalyticsDashboard } from '@/components/analytics/AdvancedAnalyticsDashboard'
import { RealTimeAnalytics } from '@/components/analytics/RealTimeAnalytics'
import { ConversionFunnelAnalysis } from '@/components/analytics/ConversionFunnelAnalysis'
import { CompetitorAnalysis } from '@/components/analytics/CompetitorAnalysis'
import { PerformanceDashboard } from '@/components/performance/PerformanceDashboard'
import { 
  BarChart3, 
  Activity, 
  TrendingUp, 
  Users, 
  Zap,
  Calendar,
  Download,
  Settings,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type AnalyticsView = 'overview' | 'realtime' | 'funnel' | 'competitors' | 'performance'

export default function AnalyticsPage() {
  const [activeView, setActiveView] = useState<AnalyticsView>('overview')
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date()
  })

  const analyticsViews = [
    {
      id: 'overview' as const,
      name: 'Overview',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Comprehensive analytics dashboard with predictive insights'
    },
    {
      id: 'realtime' as const,
      name: 'Real-Time',
      icon: <Activity className="w-5 h-5" />,
      description: 'Live analytics with automatic updates'
    },
    {
      id: 'funnel' as const,
      name: 'Conversion Funnel',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'User journey analysis and conversion optimization'
    },
    {
      id: 'competitors' as const,
      name: 'Competitors',
      icon: <Users className="w-5 h-5" />,
      description: 'Market intelligence and competitive analysis'
    },
    {
      id: 'performance' as const,
      name: 'Performance',
      icon: <Zap className="w-5 h-5" />,
      description: 'Technical performance metrics and optimization'
    }
  ]

  const handleDateRangeChange = (range: { start: Date; end: Date }) => {
    setDateRange(range)
  }

  const handleExportData = () => {
    // Implementation for exporting analytics data
    console.log('Exporting analytics data...')
  }

  return (
    <Container className="py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Analytics & Business Intelligence
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Advanced analytics with predictive insights and real-time monitoring
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Date Range Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                value={`${Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24))}`}
                onChange={(e) => {
                  const days = parseInt(e.target.value)
                  setDateRange({
                    start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                    end: new Date()
                  })
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            
            <Button variant="outline" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {analyticsViews.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={cn(
                  'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                  activeView === view.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {view.icon}
                <span>{view.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Analytics Content */}
      <div className="space-y-8">
        {activeView === 'overview' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Advanced Analytics Overview
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive dashboard with predictive insights, trend analysis, and business intelligence
              </p>
            </div>
            <AdvancedAnalyticsDashboard 
              dateRange={dateRange}
              autoRefresh={true}
              refreshInterval={60000} // 1 minute
            />
          </div>
        )}

        {activeView === 'realtime' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Real-Time Analytics
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Live data updates with automatic refresh and activity monitoring
              </p>
            </div>
            <RealTimeAnalytics 
              updateInterval={10000} // 10 seconds
              maxDataPoints={50}
            />
          </div>
        )}

        {activeView === 'funnel' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Conversion Funnel Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Track user journey, identify bottlenecks, and optimize conversion rates
              </p>
            </div>
            <ConversionFunnelAnalysis dateRange={dateRange} />
          </div>
        )}

        {activeView === 'competitors' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Competitor Analysis
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Market intelligence, competitive benchmarking, and opportunity identification
              </p>
            </div>
            <CompetitorAnalysis />
          </div>
        )}

        {activeView === 'performance' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Performance Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Technical performance metrics, optimization recommendations, and system health
              </p>
            </div>
            <PerformanceDashboard />
          </div>
        )}
      </div>

      {/* Quick Stats Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <QuickStatCard
            title="Data Points Analyzed"
            value="2.4M+"
            change={12.5}
            icon={<BarChart3 className="w-5 h-5" />}
          />
          <QuickStatCard
            title="Predictions Made"
            value="1,247"
            change={8.3}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <QuickStatCard
            title="Insights Generated"
            value="89"
            change={-2.1}
            icon={<Activity className="w-5 h-5" />}
          />
          <QuickStatCard
            title="Accuracy Rate"
            value="94.2%"
            change={1.8}
            icon={<Zap className="w-5 h-5" />}
          />
        </div>
      </div>
    </Container>
  )
}

// Quick Stat Card Component
interface QuickStatCardProps {
  title: string
  value: string
  change: number
  icon: React.ReactNode
}

function QuickStatCard({ title, value, change, icon }: QuickStatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className={cn('flex items-center space-x-1 text-sm',
          change > 0 ? 'text-green-600' : 'text-red-600'
        )}>
          {change > 0 ? '↗' : '↘'}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </p>
    </div>
  )
}