'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLinkManagement } from '@/hooks/useLinkManagement'
import { 
  RotateCcw, 
  TrendingUp, 
  Settings, 
  BarChart3,
  Shuffle,
  Target,
  Loader2,
  Info
} from 'lucide-react'

const rotationConfigSchema = z.object({
  productId: z.string().uuid(),
  strategy: z.enum(['round_robin', 'weighted', 'performance_based', 'random']),
  testDuration: z.number().min(1).max(365).default(30),
  trafficSplit: z.number().min(0.1).max(1).default(1),
  weights: z.record(z.string().uuid(), z.number().min(0).max(1)).optional(),
})

type RotationConfigForm = z.infer<typeof rotationConfigSchema>

interface LinkRotationManagerProps {
  productId: string
  productTitle?: string
}

interface LinkPerformance {
  id: string
  platform: string
  originalUrl: string
  shortenedUrl?: string
  commission: number
  priority: number
  analytics: {
    totalClicks: number
    totalConversions: number
    totalRevenue: number
    conversionRate: number
    averageOrderValue: number
  }
}

export function LinkRotationManager({ productId, productTitle }: LinkRotationManagerProps) {
  const [rotationData, setRotationData] = useState<{
    productId: string
    totalLinks: number
    links: LinkPerformance[]
  } | null>(null)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({})

  const { 
    setupLinkRotation, 
    getRotationConfig, 
    isSettingUpRotation 
  } = useLinkManagement()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<RotationConfigForm>({
    resolver: zodResolver(rotationConfigSchema),
    defaultValues: {
      productId,
      strategy: 'performance_based',
      testDuration: 30,
      trafficSplit: 1,
    }
  })

  const watchedStrategy = watch('strategy')

  useEffect(() => {
    loadRotationData()
  }, [productId])

  const loadRotationData = async () => {
    const data = await getRotationConfig(productId)
    if (data) {
      setRotationData(data)
      
      // Initialize custom weights
      const weights: Record<string, number> = {}
      data.links.forEach((link: LinkPerformance) => {
        weights[link.id] = 1 / data.links.length // Equal weights by default
      })
      setCustomWeights(weights)
    }
  }

  const onSubmit = async (data: RotationConfigForm) => {
    const config = {
      ...data,
      weights: watchedStrategy === 'weighted' ? customWeights : undefined,
    }

    const result = await setupLinkRotation(config)
    if (result) {
      setIsConfiguring(false)
      await loadRotationData()
    }
  }

  const handleWeightChange = (linkId: string, weight: number) => {
    setCustomWeights(prev => ({
      ...prev,
      [linkId]: weight
    }))
  }

  const normalizeWeights = () => {
    const totalWeight = Object.values(customWeights).reduce((sum, weight) => sum + weight, 0)
    if (totalWeight === 0) return

    const normalized: Record<string, number> = {}
    Object.entries(customWeights).forEach(([linkId, weight]) => {
      normalized[linkId] = weight / totalWeight
    })
    setCustomWeights(normalized)
  }

  const getStrategyIcon = (strategy: string) => {
    const icons = {
      round_robin: <RotateCcw className="w-4 h-4" />,
      weighted: <Settings className="w-4 h-4" />,
      performance_based: <TrendingUp className="w-4 h-4" />,
      random: <Shuffle className="w-4 h-4" />
    }
    return icons[strategy as keyof typeof icons] || <Settings className="w-4 h-4" />
  }

  const getStrategyDescription = (strategy: string) => {
    const descriptions = {
      round_robin: 'Distribute traffic equally across all links in rotation',
      weighted: 'Distribute traffic based on custom weights you set',
      performance_based: 'Automatically distribute traffic based on conversion performance',
      random: 'Randomly select links for each visitor'
    }
    return descriptions[strategy as keyof typeof descriptions] || ''
  }

  const getPerformanceColor = (conversionRate: number) => {
    if (conversionRate >= 0.05) return 'text-green-600'
    if (conversionRate >= 0.02) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!rotationData) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
          <p className="text-gray-500">Loading rotation data...</p>
        </div>
      </Card>
    )
  }

  if (rotationData.totalLinks < 2) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Link Rotation Not Available</h3>
          <p className="text-gray-600 mb-4">
            You need at least 2 active affiliate links to set up rotation for this product.
          </p>
          <p className="text-sm text-gray-500">
            Current active links: {rotationData.totalLinks}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Link Rotation Management</h3>
            {productTitle && (
              <p className="text-sm text-gray-600">Product: {productTitle}</p>
            )}
          </div>
          <Button
            onClick={() => setIsConfiguring(!isConfiguring)}
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            {isConfiguring ? 'Cancel' : 'Configure Rotation'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{rotationData.totalLinks}</div>
            <div className="text-sm text-gray-600">Active Links</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {rotationData.links.reduce((sum, link) => sum + link.analytics.totalClicks, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {rotationData.links.reduce((sum, link) => sum + link.analytics.totalConversions, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Conversions</div>
          </div>
        </div>
      </Card>

      {/* Configuration Form */}
      {isConfiguring && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Rotation Configuration</h4>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rotation Strategy
              </label>
              <div className="space-y-3">
                {['round_robin', 'weighted', 'performance_based', 'random'].map((strategy) => (
                  <label key={strategy} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      value={strategy}
                      {...register('strategy')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStrategyIcon(strategy)}
                        <span className="font-medium capitalize">
                          {strategy.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {getStrategyDescription(strategy)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {watchedStrategy === 'weighted' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium">
                    Custom Weights
                  </label>
                  <Button
                    type="button"
                    onClick={normalizeWeights}
                    variant="ghost"
                    size="sm"
                  >
                    Normalize
                  </Button>
                </div>
                <div className="space-y-3">
                  {rotationData.links.map((link) => (
                    <div key={link.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{link.platform}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {link.originalUrl}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={customWeights[link.id] || 0}
                          onChange={(e) => handleWeightChange(link.id, parseFloat(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm font-mono w-12">
                          {((customWeights[link.id] || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Test Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  {...register('testDuration', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.testDuration && (
                  <p className="text-sm text-red-600 mt-1">{errors.testDuration.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Traffic Split (0.1 - 1.0)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.1"
                  {...register('trafficSplit', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.trafficSplit && (
                  <p className="text-sm text-red-600 mt-1">{errors.trafficSplit.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Info className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Traffic split determines what percentage of visitors will participate in the rotation test.
                Set to 1.0 to include all visitors.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSettingUpRotation}
              className="w-full"
            >
              {isSettingUpRotation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up rotation...
                </>
              ) : (
                'Setup Link Rotation'
              )}
            </Button>
          </form>
        </Card>
      )}

      {/* Link Performance Table */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Link Performance</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Platform</th>
                <th className="text-left py-2 px-4">Commission</th>
                <th className="text-left py-2 px-4">Clicks</th>
                <th className="text-left py-2 px-4">Conversions</th>
                <th className="text-left py-2 px-4">Conv. Rate</th>
                <th className="text-left py-2 px-4">Revenue</th>
                <th className="text-left py-2 px-4">AOV</th>
              </tr>
            </thead>
            <tbody>
              {rotationData.links.map((link) => (
                <tr key={link.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{link.platform}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {link.originalUrl}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {(link.commission * 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-4">
                    {link.analytics.totalClicks.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    {link.analytics.totalConversions.toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={getPerformanceColor(link.analytics.conversionRate)}>
                      {(link.analytics.conversionRate * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    ${link.analytics.totalRevenue.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    ${link.analytics.averageOrderValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}