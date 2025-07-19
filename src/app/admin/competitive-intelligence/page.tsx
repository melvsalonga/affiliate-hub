import { Metadata } from 'next'
import CompetitiveIntelligenceDashboard from '@/components/analytics/CompetitiveIntelligenceDashboard'
import MarketTrendsAnalysis from '@/components/analytics/MarketTrendsAnalysis'
import CompetitorPriceMonitor from '@/components/analytics/CompetitorPriceMonitor'

export const metadata: Metadata = {
  title: 'Competitive Intelligence - LinkVault Pro',
  description: 'Monitor competitors, analyze market trends, and gain competitive insights',
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { 
  TargetIcon, 
  TrendingUpIcon, 
  DollarSignIcon 
} from 'lucide-react'

export default function CompetitiveIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'pricing'>('overview')

  const tabs = [
    { id: 'overview', label: 'Intelligence Overview', icon: TargetIcon },
    { id: 'trends', label: 'Market Trends', icon: TrendingUpIcon },
    { id: 'pricing', label: 'Price Monitoring', icon: DollarSignIcon },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <CompetitiveIntelligenceDashboard />}
      {activeTab === 'trends' && <MarketTrendsAnalysis />}
      {activeTab === 'pricing' && <CompetitorPriceMonitor />}
    </div>
  )
}