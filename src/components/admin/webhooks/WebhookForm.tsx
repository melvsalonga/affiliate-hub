'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface WebhookFormProps {
  webhook?: any
  onSave: () => void
  onCancel: () => void
}

const WEBHOOK_EVENTS = [
  { value: 'PRODUCT_CREATED', label: 'Product Created', description: 'Triggered when a new product is created' },
  { value: 'PRODUCT_UPDATED', label: 'Product Updated', description: 'Triggered when a product is updated' },
  { value: 'PRODUCT_DELETED', label: 'Product Deleted', description: 'Triggered when a product is deleted' },
  { value: 'PRODUCT_STATUS_CHANGED', label: 'Product Status Changed', description: 'Triggered when product status changes' },
  { value: 'LINK_CLICKED', label: 'Link Clicked', description: 'Triggered when an affiliate link is clicked' },
  { value: 'CONVERSION_TRACKED', label: 'Conversion Tracked', description: 'Triggered when a conversion is recorded' },
  { value: 'USER_REGISTERED', label: 'User Registered', description: 'Triggered when a new user registers' },
  { value: 'USER_UPDATED', label: 'User Updated', description: 'Triggered when user profile is updated' },
  { value: 'CAMPAIGN_STARTED', label: 'Campaign Started', description: 'Triggered when a campaign starts' },
  { value: 'CAMPAIGN_ENDED', label: 'Campaign Ended', description: 'Triggered when a campaign ends' },
  { value: 'PRICE_ALERT_TRIGGERED', label: 'Price Alert Triggered', description: 'Triggered when a price alert is activated' },
  { value: 'ANALYTICS_MILESTONE', label: 'Analytics Milestone', description: 'Triggered when analytics milestones are reached' },
]

export function WebhookForm({ webhook, onSave, onCancel }: WebhookFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    secret: '',
    events: [] as string[],
    retryAttempts: 3,
    timeout: 30,
    isActive: true,
    headers: {} as Record<string, string>,
  })
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (webhook) {
      setFormData({
        name: webhook.name || '',
        description: webhook.description || '',
        url: webhook.url || '',
        secret: webhook.secret || '',
        events: webhook.events || [],
        retryAttempts: webhook.retryAttempts || 3,
        timeout: webhook.timeout || 30,
        isActive: webhook.isActive ?? true,
        headers: webhook.headers || {},
      })

      // Convert headers object to array for editing
      const headerEntries = Object.entries(webhook.headers || {})
      setCustomHeaders(headerEntries.map(([key, value]) => ({ key, value })))
    }
  }, [webhook])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleEventToggle = (eventValue: string) => {
    const newEvents = formData.events.includes(eventValue)
      ? formData.events.filter(e => e !== eventValue)
      : [...formData.events, eventValue]
    
    handleInputChange('events', newEvents)
  }

  const handleAddHeader = () => {
    setCustomHeaders(prev => [...prev, { key: '', value: '' }])
  }

  const handleRemoveHeader = (index: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index))
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    setCustomHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ))
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required'
    } else {
      try {
        new URL(formData.url)
      } catch {
        newErrors.url = 'Please enter a valid URL'
      }
    }

    if (formData.events.length === 0) {
      newErrors.events = 'At least one event must be selected'
    }

    if (formData.retryAttempts < 0 || formData.retryAttempts > 10) {
      newErrors.retryAttempts = 'Retry attempts must be between 0 and 10'
    }

    if (formData.timeout < 5 || formData.timeout > 300) {
      newErrors.timeout = 'Timeout must be between 5 and 300 seconds'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Convert headers array back to object
      const headers = customHeaders.reduce((acc, { key, value }) => {
        if (key.trim() && value.trim()) {
          acc[key.trim()] = value.trim()
        }
        return acc
      }, {} as Record<string, string>)

      const payload = {
        ...formData,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      }

      const url = webhook ? `/api/webhooks/${webhook.id}` : '/api/webhooks'
      const method = webhook ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        onSave()
      } else {
        setErrors({ submit: data.error || 'Failed to save webhook' })
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save webhook' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter webhook name"
            error={errors.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter webhook description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL *
          </label>
          <Input
            value={formData.url}
            onChange={(e) => handleInputChange('url', e.target.value)}
            placeholder="https://example.com/webhook"
            error={errors.url}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Secret (Optional)
          </label>
          <Input
            value={formData.secret}
            onChange={(e) => handleInputChange('secret', e.target.value)}
            placeholder="Enter webhook secret for signature verification"
            type="password"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used to generate HMAC signature for webhook verification
          </p>
        </div>
      </div>

      {/* Events */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Events * {errors.events && <span className="text-red-500 text-sm">({errors.events})</span>}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {WEBHOOK_EVENTS.map((event) => (
            <Card
              key={event.value}
              className={`p-3 cursor-pointer transition-colors ${
                formData.events.includes(event.value)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleEventToggle(event.value)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={() => handleEventToggle(event.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium text-sm">{event.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {event.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retry Attempts
          </label>
          <Input
            type="number"
            value={formData.retryAttempts}
            onChange={(e) => handleInputChange('retryAttempts', parseInt(e.target.value))}
            min="0"
            max="10"
            error={errors.retryAttempts}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timeout (seconds)
          </label>
          <Input
            type="number"
            value={formData.timeout}
            onChange={(e) => handleInputChange('timeout', parseInt(e.target.value))}
            min="5"
            max="300"
            error={errors.timeout}
          />
        </div>
      </div>

      {/* Custom Headers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Custom Headers
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddHeader}
          >
            Add Header
          </Button>
        </div>
        
        {customHeaders.length > 0 && (
          <div className="space-y-2">
            {customHeaders.map((header, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  placeholder="Header name"
                  value={header.key}
                  onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Header value"
                  value={header.value}
                  onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveHeader(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => handleInputChange('isActive', e.target.checked)}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
          Active
        </label>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="text-red-600 text-sm">{errors.submit}</div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          {webhook ? 'Update' : 'Create'} Webhook
        </Button>
      </div>
    </form>
  )
}