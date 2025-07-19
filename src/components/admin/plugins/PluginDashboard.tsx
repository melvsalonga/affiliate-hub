'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { 
  PuzzlePieceIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  CogIcon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Plugin {
  id: string
  name: string
  version: string
  description: string
  author: string
  category: string
  status: 'active' | 'inactive' | 'error'
  config: Record<string, any>
  permissions: string[]
  installDate: string
  lastUpdate: string
}

export function PluginDashboard() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)

  useEffect(() => {
    fetchPlugins()
  }, [])

  const fetchPlugins = async () => {
    try {
      const response = await fetch('/api/plugins')
      const data = await response.json()
      
      if (data.success) {
        setPlugins(data.data)
      }
    } catch (error) {
      console.error('Error fetching plugins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePlugin = async (plugin: Plugin) => {
    try {
      const response = await fetch(`/api/plugins/${plugin.id}/toggle`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchPlugins()
      }
    } catch (error) {
      console.error('Error toggling plugin:', error)
    }
  }

  const handleDeletePlugin = async (plugin: Plugin) => {
    if (!confirm(`Are you sure you want to uninstall "${plugin.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/plugins/${plugin.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchPlugins()
      }
    } catch (error) {
      console.error('Error deleting plugin:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics':
        return 'bg-blue-100 text-blue-800'
      case 'marketing':
        return 'bg-green-100 text-green-800'
      case 'integration':
        return 'bg-purple-100 text-purple-800'
      case 'ui':
        return 'bg-pink-100 text-pink-800'
      case 'utility':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
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
          <h2 className="text-2xl font-bold text-gray-900">Plugin Management</h2>
          <p className="text-gray-600">Extend your platform with custom plugins</p>
        </div>
        <Button
          onClick={() => {
            // Open plugin installation modal
            console.log('Open plugin installation')
          }}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Install Plugin
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <PuzzlePieceIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Plugins</p>
              <p className="text-2xl font-semibold text-gray-900">{plugins.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <PlayIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active</p>
              <p className="text-2xl font-semibold text-green-600">
                {plugins.filter(p => p.status === 'active').length}
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
                {plugins.filter(p => p.status === 'inactive').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Errors</p>
              <p className="text-2xl font-semibold text-red-600">
                {plugins.filter(p => p.status === 'error').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Plugin List */}
      <div className="space-y-4">
        {plugins.length === 0 ? (
          <Card className="p-8 text-center">
            <PuzzlePieceIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No plugins installed</h3>
            <p className="text-gray-500 mb-4">
              Install plugins to extend your platform's functionality.
            </p>
            <Button onClick={() => console.log('Open plugin marketplace')}>
              Browse Plugin Marketplace
            </Button>
          </Card>
        ) : (
          plugins.map((plugin) => (
            <Card key={plugin.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {plugin.name}
                    </h3>
                    <Badge className={getStatusColor(plugin.status)}>
                      {plugin.status}
                    </Badge>
                    <Badge className={getCategoryColor(plugin.category)}>
                      {plugin.category}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{plugin.description}</p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>
                        <span className="font-medium">Version:</span> {plugin.version}
                      </span>
                      <span>
                        <span className="font-medium">Author:</span> {plugin.author}
                      </span>
                      <span>
                        <span className="font-medium">Installed:</span>{' '}
                        {new Date(plugin.installDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div>
                      <span className="font-medium">Permissions:</span>{' '}
                      {plugin.permissions.join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlugin(plugin)
                      setShowConfigModal(true)
                    }}
                  >
                    <CogIcon className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePlugin(plugin)}
                  >
                    {plugin.status === 'active' ? (
                      <PauseIcon className="h-4 w-4" />
                    ) : (
                      <PlayIcon className="h-4 w-4" />
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeletePlugin(plugin)}
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

      {/* Plugin Configuration Modal */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={`Configure ${selectedPlugin?.name}`}
        size="lg"
      >
        {selectedPlugin && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Configuration</h4>
              <pre className="text-sm text-gray-600 overflow-x-auto">
                {JSON.stringify(selectedPlugin.config, null, 2)}
              </pre>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowConfigModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  // Save configuration
                  console.log('Save plugin configuration')
                  setShowConfigModal(false)
                }}
              >
                Save Configuration
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}