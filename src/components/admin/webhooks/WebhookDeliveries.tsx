'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

interface WebhookDelivery {
  id: string
  event: string
  payload: any
  httpStatus?: number
  responseBody?: string
  responseTime?: number
  attempt: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RETRYING'
  errorMessage?: string
  deliveredAt?: string
  createdAt: string
  nextRetryAt?: string
}

interface WebhookDeliveriesProps {
  webhookId: string
}

export function WebhookDeliveries({ webhookId }: WebhookDeliveriesProps) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null)

  useEffect(() => {
    fetchDeliveries()
  }, [webhookId, pagination.page])

  const fetchDeliveries = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/webhooks/deliveries?webhookId=${webhookId}&page=${pagination.page}&limit=${pagination.limit}`
      )
      const data = await response.json()
      
      if (data.success) {
        setDeliveries(data.data.deliveries)
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages,
        }))
      }
    } catch (error) {
      console.error('Error fetching webhook deliveries:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'RETRYING':
        return <ArrowPathIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-green-100 text-green-800'
      case 'FAILED':
        return 'bg-red-100 text-red-800'
      case 'RETRYING':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatResponseTime = (ms?: number) => {
    if (!ms) return 'N/A'
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Deliveries List */}
      {deliveries.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-gray-500">
            <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No deliveries yet</h3>
            <p>Webhook deliveries will appear here once events are triggered.</p>
          </div>
        </Card>
      ) : (
        deliveries.map((delivery) => (
          <Card key={delivery.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {getStatusIcon(delivery.status)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {delivery.event.replace('_', ' ')}
                    </span>
                    <Badge className={getStatusColor(delivery.status)}>
                      {delivery.status}
                    </Badge>
                    {delivery.httpStatus && (
                      <Badge className="bg-gray-100 text-gray-800">
                        HTTP {delivery.httpStatus}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="flex items-center space-x-4">
                      <span>Attempt: {delivery.attempt}</span>
                      <span>Response Time: {formatResponseTime(delivery.responseTime)}</span>
                      <span>Created: {formatDate(delivery.createdAt)}</span>
                    </div>
                    
                    {delivery.deliveredAt && (
                      <div>Delivered: {formatDate(delivery.deliveredAt)}</div>
                    )}
                    
                    {delivery.nextRetryAt && (
                      <div>Next Retry: {formatDate(delivery.nextRetryAt)}</div>
                    )}
                    
                    {delivery.errorMessage && (
                      <div className="text-red-600 font-mono text-xs bg-red-50 p-2 rounded">
                        {delivery.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDelivery(delivery)}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} deliveries
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            
            <span className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.pages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Delivery Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDelivery(null)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">Event:</span>
                      <span className="ml-2">{selectedDelivery.event}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(selectedDelivery.status)}`}>
                        {selectedDelivery.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Attempt:</span>
                      <span className="ml-2">{selectedDelivery.attempt}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Response Time:</span>
                      <span className="ml-2">{formatResponseTime(selectedDelivery.responseTime)}</span>
                    </div>
                    {selectedDelivery.httpStatus && (
                      <div>
                        <span className="font-medium text-gray-500">HTTP Status:</span>
                        <span className="ml-2">{selectedDelivery.httpStatus}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payload */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Payload</h4>
                  <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedDelivery.payload, null, 2)}
                  </pre>
                </div>

                {/* Response */}
                {selectedDelivery.responseBody && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Response</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {selectedDelivery.responseBody}
                    </pre>
                  </div>
                )}

                {/* Error */}
                {selectedDelivery.errorMessage && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Error</h4>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-sm text-red-700">
                      {selectedDelivery.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}