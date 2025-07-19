'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  AlertCircleIcon,
  DollarSignIcon,
  CalendarIcon,
  ExternalLinkIcon
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface CompetitorProduct {
  id: string
  name: string
  url: string
  currentPrice: number
  originalPrice?: number
  currency: string
  availability: string
  lastChecked: string
  competitor: {
    name: string
    domain: string
  }
  priceHistory: Array<{
    price: number
    recordedAt: string
  }>
}

interface PriceAlert {
  id: string
  productName: string
  competitorName: string
  oldPrice: number
  newPrice: number
  changePercent: number
  detectedAt: string
}

export default function CompetitorPriceMonitor() {
  const [products, setProducts] = useState<CompetitorProduct[]>([])
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [selectedProduct, setSelectedProduct] = useState<CompetitorProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [monitoring, setMonitoring] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsRes, alertsRes] = await Promise.all([
        fetch('/api/competitors/products'),
        fetch('/api/competitors/price-alerts')
      ])

      const [productsData, alertsData] = await Promise.all([
        productsRes.json(),
        alertsRes.json()
      ])

      setProducts(productsData.products || [])
      setAlerts(alertsData.alerts || [])
    } catch (error) {
      console.error('Error loading price monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startMonitoring = async () => {
    setMonitoring(true)
    try {
      await fetch('/api/competitors/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'monitor_prices' })
      })
      await loadData()
    } catch (error) {
      console.error('Error starting price monitoring:', error)
    } finally {
      setMonitoring(false)
    }
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'IN_STOCK': return 'bg-green-100 text-green-800'
      case 'OUT_OF_STOCK': return 'bg-red-100 text-red-800'
      case 'LIMITED_STOCK': return 'bg-yellow-100 text-yellow-800'
      case 'DISCONTINUED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriceChangeIcon = (changePercent: number) => {
    if (changePercent > 0) {
      return <TrendingUpIcon className="w-4 h-4 text-red-500" />
    } else if (changePercent < 0) {
      return <TrendingDownIcon className="w-4 h-4 text-green-500" />
    }
    return null
  }

  const formatPriceHistory = (product: CompetitorProduct) => {
    return product.priceHistory.map(entry => ({
      date: new Date(entry.recordedAt).toLocaleDateString(),
      price: entry.price,
      timestamp: entry.recordedAt
    })).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <h2 className="text-xl font-bold text-gray-900">Price Monitoring</h2>
          <p className="text-gray-600">Track competitor pricing changes in real-time</p>
        </div>
        <Button
          onClick={startMonitoring}
          loading={monitoring}
          icon={<DollarSignIcon className="w-4 h-4" />}
        >
          {monitoring ? 'Monitoring...' : 'Check Prices Now'}
        </Button>
      </div>

      {/* Price Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircleIcon className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Price Changes</h3>
            <Badge variant="outline">{alerts.length} alerts</Badge>
          </div>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getPriceChangeIcon(alert.changePercent)}
                  <div>
                    <p className="font-medium text-gray-900">{alert.productName}</p>
                    <p className="text-sm text-gray-600">{alert.competitorName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    ${alert.oldPrice} → ${alert.newPrice}
                  </p>
                  <p className={`text-sm ${alert.changePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {alert.changePercent > 0 ? '+' : ''}{alert.changePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 line-clamp-2">{product.name}</h4>
                <p className="text-sm text-gray-600">{product.competitor.name}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    ${product.currentPrice}
                  </p>
                  {product.originalPrice && product.originalPrice !== product.currentPrice && (
                    <p className="text-sm text-gray-500 line-through">
                      ${product.originalPrice}
                    </p>
                  )}
                </div>
                <Badge className={getAvailabilityColor(product.availability)}>
                  {product.availability.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {new Date(product.lastChecked).toLocaleDateString()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProduct(product)}
                >
                  View History
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(product.url, '_blank')}
                  icon={<ExternalLinkIcon className="w-4 h-4" />}
                >
                  View Product
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Price History Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-gray-600">{selectedProduct.competitor.name}</p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedProduct(null)}
                >
                  ×
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">${selectedProduct.currentPrice}</p>
                  <p className="text-sm text-gray-600">Current Price</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedProduct.priceHistory.length}
                  </p>
                  <p className="text-sm text-gray-600">Price Points</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge className={getAvailabilityColor(selectedProduct.availability)}>
                    {selectedProduct.availability.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Availability</p>
                </div>
              </div>

              {selectedProduct.priceHistory.length > 0 && (
                <div className="h-64 mb-6">
                  <h4 className="font-medium text-gray-900 mb-4">Price History</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatPriceHistory(selectedProduct)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value) => [`$${value}`, 'Price']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedProduct.url, '_blank')}
                  icon={<ExternalLinkIcon className="w-4 h-4" />}
                >
                  View Product
                </Button>
                <Button onClick={() => setSelectedProduct(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}