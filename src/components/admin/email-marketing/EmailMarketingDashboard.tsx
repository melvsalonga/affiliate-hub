'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { CampaignForm } from './CampaignForm'
import { TemplateEditor } from './TemplateEditor'
import { 
  PlusIcon, 
  EnvelopeIcon, 
  UsersIcon,
  ChartBarIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

interface Campaign {
  id: string
  name: string
  type: string
  status: string
  trigger: string
  subscribers: number
  openRate: number
  clickRate: number
  createdAt: string
}

interface EmailStats {
  subscribers: {
    total: number
    active: number
    growth: {
      thisMonth: number
      growthRate: number
    }
  }
  campaigns: {
    total: number
    active: number
    scheduled: number
    draft: number
  }
  performance: {
    averageOpenRate: number
    averageClickRate: number
    averageUnsubscribeRate: number
  }
}

export function EmailMarketingDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    fetchCampaigns()
    fetchStats()
  }, [])

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/email-marketing/campaigns')
      const data = await response.json()
      
      if (data.success) {
        setCampaigns(data.data)
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/email-marketing/stats')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'bg-purple-100 text-purple-800'
      case 'price_alert':
        return 'bg-red-100 text-red-800'
      case 'newsletter':
        return 'bg-blue-100 text-blue-800'
      case 'deal_notification':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Subscribers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.subscribers.total.toLocaleString()}</p>
                <p className="text-xs text-green-600">
                  +{stats.subscribers.growth.thisMonth} this month ({stats.subscribers.growth.growthRate}%)
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{stats.campaigns.active}</p>
                <p className="text-xs text-gray-500">
                  {stats.campaigns.total} total campaigns
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <EyeIcon className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Open Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.performance.averageOpenRate}%</p>
                <p className="text-xs text-gray-500">Industry avg: 21.3%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Click Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.performance.averageClickRate}%</p>
                <p className="text-xs text-gray-500">Industry avg: 2.6%</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Marketing</h2>
          <p className="text-gray-600">Manage your email campaigns and automation</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplateModal(true)}
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Templates
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length === 0 ? (
          <Card className="p-8 text-center">
            <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first email campaign to start engaging with your audience.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Campaign
            </Button>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {campaign.name}
                    </h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    <Badge className={getTypeColor(campaign.type)}>
                      {campaign.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                    <div>
                      <span className="font-medium">Subscribers:</span>
                      <span className="ml-1">{campaign.subscribers.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Open Rate:</span>
                      <span className="ml-1">{campaign.openRate}%</span>
                    </div>
                    <div>
                      <span className="font-medium">Click Rate:</span>
                      <span className="ml-1">{campaign.clickRate}%</span>
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>
                      <span className="ml-1">
                        {new Date(campaign.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // View campaign details
                      console.log('View campaign:', campaign.id)
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Toggle campaign status
                      console.log('Toggle campaign:', campaign.id)
                    }}
                  >
                    {campaign.status === 'active' ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCampaign(campaign)
                      setShowCreateModal(true)
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
                        console.log('Delete campaign:', campaign.id)
                      }
                    }}
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

      {/* Create/Edit Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setSelectedCampaign(null)
        }}
        title={selectedCampaign ? 'Edit Campaign' : 'Create Campaign'}
        size="lg"
      >
        <CampaignForm
          campaign={selectedCampaign}
          onSave={() => {
            setShowCreateModal(false)
            setSelectedCampaign(null)
            fetchCampaigns()
          }}
          onCancel={() => {
            setShowCreateModal(false)
            setSelectedCampaign(null)
          }}
        />
      </Modal>

      {/* Template Editor Modal */}
      <Modal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Email Templates"
        size="xl"
      >
        <TemplateEditor
          onClose={() => setShowTemplateModal(false)}
        />
      </Modal>
    </div>
  )
}