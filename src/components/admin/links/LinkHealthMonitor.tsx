'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useLinkManagement } from '@/hooks/useLinkManagement'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Activity,
  Clock,
  ExternalLink,
  Loader2
} from 'lucide-react'

interface LinkHealthData {
  linkId: string
  isHealthy: boolean
  lastChecked: string
  status: number
  responseTime: number
  error?: string
  affiliateLink?: {
    id: string
    originalUrl: string
    shortenedUrl?: string
    platform: {
      displayName: string
    }
    product: {
      title: string
    }
  }
}

interface LinkHealthMonitorProps {
  productId?: string
  platformId?: string
  initialLinks?: LinkHealthData[]
}

export function LinkHealthMonitor({ productId, platformId, initialLinks = [] }: LinkHealthMonitorProps) {
  const [healthData, setHealthData] = useState<LinkHealthData[]>(initialLinks)
  const [selectedLinks, setSelectedLinks] = useState<string[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const { 
    performHealthCheck, 
    batchHealthCheck, 
    isHealthChecking 
  } = useLinkManagement()

  const handleHealthCheck = async (linkIds?: string[]) => {
    const options = linkIds ? { linkIds } : { productId, platformId }
    const results = await performHealthCheck(options)
    
    if (results) {
      setHealthData(results)
      setLastUpdate(new Date())
    }
  }

  const handleBatchHealthCheck = async () => {
    const success = await batchHealthCheck()
    if (success) {
      setLastUpdate(new Date())
      // Refresh current view
      await handleHealthCheck()
    }
  }

  const handleSelectLink = (linkId: string) => {
    setSelectedLinks(prev => 
      prev.includes(linkId) 
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId]
    )
  }

  const handleSelectAll = () => {
    if (selectedLinks.length === healthData.length) {
      setSelectedLinks([])
    } else {
      setSelectedLinks(healthData.map(link => link.linkId))
    }
  }

  const getStatusBadge = (isHealthy: boolean, status: number) => {
    if (isHealthy) {
      return <Badge className="bg-green-100 text-green-800">Healthy</Badge>
    } else if (status === 0) {
      return <Badge className="bg-red-100 text-red-800">Unreachable</Badge>
    } else if (status >= 400) {
      return <Badge className="bg-red-100 text-red-800">Error {status}</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>
    }
  }

  const getStatusIcon = (isHealthy: boolean, status: number) => {
    if (isHealthy) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    } else if (status === 0) {
      return <XCircle className="w-4 h-4 text-red-500" />
    } else {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 1000) return 'text-green-600'
    if (responseTime < 3000) return 'text-yellow-600'
    return 'text-red-600'
  }

  const healthyCount = healthData.filter(link => link.isHealthy).length
  const unhealthyCount = healthData.length - healthyCount

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Link Health Overview</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {lastUpdate ? (
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            ) : (
              <span>No recent updates</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{healthyCount}</div>
            <div className="text-sm text-gray-600">Healthy Links</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{unhealthyCount}</div>
            <div className="text-sm text-gray-600">Unhealthy Links</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{healthData.length}</div>
            <div className="text-sm text-gray-600">Total Links</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleHealthCheck()}
            disabled={isHealthChecking}
            variant="outline"
          >
            {isHealthChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Check All
              </>
            )}
          </Button>

          {selectedLinks.length > 0 && (
            <Button
              onClick={() => handleHealthCheck(selectedLinks)}
              disabled={isHealthChecking}
              variant="outline"
            >
              Check Selected ({selectedLinks.length})
            </Button>
          )}

          <Button
            onClick={handleBatchHealthCheck}
            disabled={isHealthChecking}
            variant="outline"
          >
            <Activity className="w-4 h-4 mr-2" />
            Batch Check All Links
          </Button>
        </div>
      </Card>

      {/* Links Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">Link Status Details</h4>
          {healthData.length > 0 && (
            <Button
              onClick={handleSelectAll}
              variant="ghost"
              size="sm"
            >
              {selectedLinks.length === healthData.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {healthData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No health check data available</p>
            <p className="text-sm">Run a health check to see link status</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">
                    <input
                      type="checkbox"
                      checked={selectedLinks.length === healthData.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Link</th>
                  <th className="text-left py-2 px-4">Platform</th>
                  <th className="text-left py-2 px-4">Response Time</th>
                  <th className="text-left py-2 px-4">Last Checked</th>
                  <th className="text-left py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {healthData.map((link) => (
                  <tr key={link.linkId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={selectedLinks.includes(link.linkId)}
                        onChange={() => handleSelectLink(link.linkId)}
                        className="rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(link.isHealthy, link.status)}
                        {getStatusBadge(link.isHealthy, link.status)}
                      </div>
                      {link.error && (
                        <div className="text-xs text-red-600 mt-1">
                          {link.error}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {link.affiliateLink?.product && (
                          <div className="font-medium text-sm">
                            {link.affiliateLink.product.title}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {link.affiliateLink?.originalUrl || `Link ID: ${link.linkId}`}
                        </div>
                        {link.affiliateLink?.shortenedUrl && (
                          <div className="text-xs text-blue-600">
                            {link.affiliateLink.shortenedUrl}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {link.affiliateLink?.platform?.displayName || 'Unknown'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={getResponseTimeColor(link.responseTime)}>
                        {link.responseTime}ms
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(link.lastChecked).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleHealthCheck([link.linkId])}
                          disabled={isHealthChecking}
                          variant="ghost"
                          size="sm"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                        {link.affiliateLink?.originalUrl && (
                          <a
                            href={link.affiliateLink.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="w-3 h-3" />
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
  )
}