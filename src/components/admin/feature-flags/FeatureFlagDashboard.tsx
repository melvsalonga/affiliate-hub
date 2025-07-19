'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { FeatureFlagForm } from './FeatureFlagForm'
import { 
  FlagIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  PlusIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface FeatureFlag {
  id: string
  name: string
  key: string
  description: string
  type: 'boolean' | 'string' | 'number' | 'json'
  value: any
  defaultValue: any
  isActive: boolean
  rolloutPercentage: number
  conditions?: any[]
  createdAt: string
  updatedAt: string
  createdBy: string
}

export function FeatureFlagDashboard() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null)

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      const response = await fetch('/api/feature-flags')
      const data = await response.json()
      
      if (data.success) {
        setFlags(data.data)
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFlag = async (flag: FeatureFlag) => {
    try {
      const response = await fetch(`/api/feature-flags/${flag.key}/toggle`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchFlags()
      }
    } catch (error) {
      console.error('Error toggling feature flag:', error)
    }
  }

  const handleDeleteFlag = async (flag: FeatureFlag) => {
    if (!confirm(`Are you sure you want to delete "${flag.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/feature-flags/${flag.key}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchFlags()
      }
    } catch (error) {
      console.error('Error deleting feature flag:', error)
    }
  }

  const handleFlagSaved = () => {
    setShowCreateModal(false)
    setShowEditModal(false)
    setSelectedFlag(null)
    fetchFlags()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'boolean':
        return 'bg-blue-100 text-blue-800'
      case 'string':
        return 'bg-purple-100 text-purple-800'
      case 'number':
        return 'bg-orange-100 text-orange-800'
      case 'json':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatValue = (value: any, type: string) => {
    if (type === 'json') {
      return JSON.stringify(value)
    }
    return String(value)
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Feature Flags</h2>
          <p className="text-gray-600">Control feature rollouts and A/B testing</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Flag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <FlagIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Flags</p>
              <p className="text-2xl font-semibold text-gray-900">{flags.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-green-600">
                {flags.filter(f => f.isActive).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <PauseIcon className="h-8 w-8 text-gray-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Inactive</p>
              <p className="text-2xl font-semibold text-gray-600">
                {flags.filter(f => !f.isActive).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Avg. Rollout</p>
              <p className="text-2xl font-semibold text-blue-600">
                {flags.length > 0 
                  ? Math.round(flags.reduce((sum, f) => sum + f.rolloutPercentage, 0) / flags.length)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Feature Flag List */}
      <div className="space-y-4">
        {flags.length === 0 ? (
          <Card className="p-8 text-center">
            <FlagIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feature flags</h3>
            <p className="text-gray-500 mb-4">
              Create your first feature flag to start controlling feature rollouts.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Feature Flag
            </Button>
          </Card>
        ) : (
          flags.map((flag) => (
            <Card key={flag.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {flag.name}
                    </h3>
                    <Badge className={getStatusColor(flag.isActive)}>
                      {flag.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge className={getTypeColor(flag.type)}>
                      {flag.type}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{flag.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>
                        <span className="font-medium">Key:</span> {flag.key}
                      </span>
                      <span>
                        <span className="font-medium">Rollout:</span> {flag.rolloutPercentage}%
                      </span>
                      <span>
                        <span className="font-medium">Updated:</span>{' '}
                        {new Date(flag.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span>
                        <span className="font-medium">Value:</span>{' '}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {formatValue(flag.value, flag.type)}
                        </code>
                      </span>
                      <span>
                        <span className="font-medium">Default:</span>{' '}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {formatValue(flag.defaultValue, flag.type)}
                        </code>
                      </span>
                    </div>
                    
                    {flag.conditions && flag.conditions.length > 0 && (
                      <div>
                        <span className="font-medium">Conditions:</span> {flag.conditions.length} rule(s)
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // View flag details
                      console.log('View flag details:', flag)
                    }}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleFlag(flag)}
                  >
                    {flag.isActive ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFlag(flag)
                      setShowEditModal(true)
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFlag(flag)}
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

      {/* Create Feature Flag Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Feature Flag"
        size="lg"
      >
        <FeatureFlagForm
          onSave={handleFlagSaved}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Edit Feature Flag Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Feature Flag"
        size="lg"
      >
        {selectedFlag && (
          <FeatureFlagForm
            flag={selectedFlag}
            onSave={handleFlagSaved}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>
    </div>
  )
}