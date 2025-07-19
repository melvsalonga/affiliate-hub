'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { WebhookForm } from './WebhookForm'
import { WebhookDeliveries } from './WebhookDeliveries'
import { 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  TrashIcon, 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Webhook {
  id: string
  name: string
  description?: string
  url: string
  events: string[]
  isActive: boolean
  retryAttempts: number
  timeout: number
  createdAt: string
  creator: {
    email: string
    profile?: {
      firstName?: string
      lastName?: string
    }
  }
  _count: {
    deliveries: number
  }
}

interface WebhookStats {
  total: number
  successful: number
  failed: number
  pending: number
  successRate: number
}

export function WebhookList() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [stats, setStats] = useState<WebhookStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)

  useEffect(() => {
    fetchWebhooks()
    fetchStats()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/webhooks')
      const data = await response.json()
      
      if (data.success) {
        setWebhooks(data.data)
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/webhooks/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching webhook stats:', error)
    }
  }

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !webhook.isActive,
        }),
      })

      if (response.ok) {
        fetchWebhooks()
      }
    } catch (error) {
      console.error('Error toggling webhook:', error)
    }
  }

  const handleDelete = async (webhook: Webhook) => {
    if (!confirm(`Are you sure you want to delete "${webhook.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchWebhooks()
        fetchStats()
      }
    } catch (error) {
      console.error('Error deleting webhook:', error)
    }
  }

  const handleTest = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/webhooks/${webhook.id}/test`, {
        method: 'POST',
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Test webhook sent successfully!')
        fetchStats()
      } else {
        alert('Failed to send test webhook')
      }
    } catch (error) {
      console.error('Error testing webhook:', error)
      alert('Failed to send test webhook')
    }
  }

  const handleWebhookSaved = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedWebhook(null)
    fetchWebhooks()
    fetchStats()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getEventBadgeColor = (event: string) => {
    const colors: Record<string, string> = {
      PRODUCT_CREATED: 'bg-blue-100 text-blue-800',
      PRODUCT_UPDATED: 'bg-yellow-100 text-yellow-800',
      PRODUCT_DELETED: 'bg-red-100 text-red-800',
      LINK_CLICKED: 'bg-green-100 text-green-800',
      CONVERSION_TRACKED: 'bg-purple-100 text-purple-800',
      USER_REGISTERED: 'bg-indigo-100 text-indigo-800',
    }
    return colors[event] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Deliveries</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Successful</p>
                <p className="text-2xl font-semibold text-green-600">{stats.successful}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-8 w-8 text-red-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Failed</p>
                <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center">
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-blue-600">{stats.successRate}%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
          <p className="text-gray-600">Manage external service integrations</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Create Webhook</span>
        </Button>
      </div>

      {/* Webhook List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
              <p className="mb-4">Create your first webhook to start receiving notifications from external services.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Webhook
              </Button>
            </div>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {webhook.name}
                    </h3>
                    <Badge className={getStatusColor(webhook.isActive)}>
                      {webhook.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  {webhook.description && (
                    <p className="text-gray-600 mb-3">{webhook.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">URL:</span>
                      <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">
                        {webhook.url}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">Events:</span>
                      <div className="ml-2 flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge
                            key={event}
                            className={`text-xs ${getEventBadgeColor(event)}`}
                          >
                            {event.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>
                        <span className="font-medium">Deliveries:</span> {webhook._count.deliveries}
                      </span>
                      <span>
                        <span className="font-medium">Retries:</span> {webhook.retryAttempts}
                      </span>
                      <span>
                        <span className="font-medium">Timeout:</span> {webhook.timeout}s
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWebhook(webhook)
                      setShowDeliveriesModal(true)
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTest(webhook)}
                  >
                    Test
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(webhook)}
                  >
                    {webhook.isActive ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedWebhook(webhook)
                      setShowEditModal(true)
                    }}
                  >
                    Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(webhook)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Webhook Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Webhook"
        size="lg"
      >
        <WebhookForm
          onSave={handleWebhookSaved}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Webhook Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Webhook"
        size="lg"
      >
        {selectedWebhook && (
          <WebhookForm
            webhook={selectedWebhook}
            onSave={handleWebhookSaved}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Webhook Deliveries Modal */}
      <Modal
        isOpen={showDeliveriesModal}
        onClose={() => setShowDeliveriesModal(false)}
        title={`Webhook Deliveries - ${selectedWebhook?.name}`}
        size="xl"
      >
        {selectedWebhook && (
          <WebhookDeliveries webhookId={selectedWebhook.id} />
        )}
      </Modal>
    </div>
  )
}