'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { LinkProcessor } from '@/components/admin/links/LinkProcessor'
import { LinkHealthMonitor } from '@/components/admin/links/LinkHealthMonitor'
import { LinkRotationManager } from '@/components/admin/links/LinkRotationManager'
import { BulkLinkProcessor } from '@/components/admin/links/BulkLinkProcessor'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  Link, 
  Activity,
  RotateCcw,
  Plus,
  Settings,
  BarChart3,
  ExternalLink,
  Search
} from 'lucide-react'

interface Product {
  id: string
  title: string
}

interface Category {
  id: string
  name: string
}

interface AffiliateLink {
  id: string
  originalUrl: string
  shortenedUrl?: string
  platform: {
    displayName: string
  }
  product: {
    title: string
  }
  isActive: boolean
  commission: number
  createdAt: string
}

export default function LinksPage() {
  const [activeTab, setActiveTab] = useState<'processor' | 'bulk' | 'health' | 'rotation'>('processor')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      // Load products
      const productsResponse = await fetch('/api/products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.data || [])
      }

      // Load categories
      const categoriesResponse = await fetch('/api/categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.data || [])
      }

      // Load affiliate links
      const linksResponse = await fetch('/api/affiliate-links')
      if (linksResponse.ok) {
        const linksData = await linksResponse.json()
        setAffiliateLinks(linksData.data || [])
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkProcessed = (result: any) => {
    // Refresh affiliate links after processing
    loadInitialData()
  }

  const getTabIcon = (tab: string) => {
    const icons = {
      processor: <Plus className="w-4 h-4" />,
      bulk: <BarChart3 className="w-4 h-4" />,
      health: <Activity className="w-4 h-4" />,
      rotation: <RotateCcw className="w-4 h-4" />
    }
    return icons[tab as keyof typeof icons]
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)

  return (
    <AdminLayout
      title="Link Management"
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'Link Management', href: '/admin/links' }
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Smart Link Management</h1>
              <p className="text-gray-600">
                Process affiliate links, monitor health, and manage rotation strategies
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-blue-100 text-blue-800">
                {affiliateLinks.length} Total Links
              </Badge>
              <Badge className="bg-green-100 text-green-800">
                {affiliateLinks.filter(l => l.isActive).length} Active
              </Badge>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'processor', label: 'Link Processor' },
              { key: 'bulk', label: 'Bulk Processor' },
              { key: 'health', label: 'Health Monitor' },
              { key: 'rotation', label: 'Rotation Manager' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getTabIcon(tab.key)}
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        {activeTab === 'processor' && (
          <LinkProcessor
            categories={categories}
            products={products}
            onLinkProcessed={handleLinkProcessed}
          />
        )}

        {activeTab === 'bulk' && (
          <BulkLinkProcessor
            categories={categories}
            onProcessingComplete={handleLinkProcessed}
          />
        )}

        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Product Filter for Health Monitor */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Filter by Product:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Products</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
                {selectedProductId && (
                  <Button
                    onClick={() => setSelectedProductId('')}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </Card>

            <LinkHealthMonitor
              productId={selectedProductId || undefined}
            />
          </div>
        )}

        {activeTab === 'rotation' && (
          <div className="space-y-6">
            {/* Product Selection for Rotation */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Select Product for Rotation:</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title}
                    </option>
                  ))}
                </select>
              </div>
            </Card>

            {selectedProductId ? (
              <LinkRotationManager
                productId={selectedProductId}
                productTitle={selectedProduct?.title}
              />
            ) : (
              <Card className="p-8">
                <div className="text-center">
                  <RotateCcw className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">Select a Product</h3>
                  <p className="text-gray-600">
                    Choose a product from the dropdown above to manage its link rotation settings.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Recent Links Overview */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Affiliate Links</h3>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              View All Links
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading links...</p>
            </div>
          ) : affiliateLinks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No affiliate links found</p>
              <p className="text-sm">Process your first link using the Link Processor tab</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Product</th>
                    <th className="text-left py-2 px-4">Platform</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Commission</th>
                    <th className="text-left py-2 px-4">Created</th>
                    <th className="text-left py-2 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliateLinks.slice(0, 10).map((link) => (
                    <tr key={link.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{link.product.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {link.originalUrl}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {link.platform.displayName}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={link.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {(link.commission * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(link.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {link.shortenedUrl && (
                            <a
                              href={link.shortenedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-blue-400 hover:text-blue-600"
                            >
                              <Link className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}