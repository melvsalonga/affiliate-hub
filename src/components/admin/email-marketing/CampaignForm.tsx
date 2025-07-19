'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface CampaignFormProps {
  campaign?: any
  onSave: () => void
  onCancel: () => void
}

const CAMPAIGN_TYPES = [
  { value: 'newsletter', label: 'Newsletter', description: 'Regular newsletter campaigns' },
  { value: 'price_alert', label: 'Price Alert', description: 'Automated price drop notifications' },
  { value: 'deal_notification', label: 'Deal Notification', description: 'New deal announcements' },
  { value: 'welcome', label: 'Welcome Series', description: 'Welcome new subscribers' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', description: 'Recover abandoned carts' },
]

const TRIGGER_TYPES = [
  { value: 'user_signup', label: 'User Signup', description: 'When a user signs up' },
  { value: 'price_drop', label: 'Price Drop', description: 'When product price drops' },
  { value: 'new_product', label: 'New Product', description: 'When new product is added' },
  { value: 'abandoned_cart', label: 'Abandoned Cart', description: 'When cart is abandoned' },
]

export function CampaignForm({ campaign, onSave, onCancel }: CampaignFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'newsletter',
    trigger: 'user_signup',
    delay: 0,
    templateId: 'price_alert',
    conditions: {},
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        type: campaign.type || 'newsletter',
        trigger: campaign.trigger || 'user_signup',
        delay: campaign.delay || 0,
        templateId: campaign.templateId || 'price_alert',
        conditions: campaign.conditions || {},
      })
    }
  }, [campaign])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required'
    }

    if (formData.delay < 0) {
      newErrors.delay = 'Delay cannot be negative'
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
      const url = campaign ? `/api/email-marketing/campaigns/${campaign.id}` : '/api/email-marketing/campaigns'
      const method = campaign ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        onSave()
      } else {
        setErrors({ submit: data.error || 'Failed to save campaign' })
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save campaign' })
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
            Campaign Name *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Enter campaign name"
            error={errors.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Campaign Type *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CAMPAIGN_TYPES.map((type) => (
              <Card
                key={type.value}
                className={`p-3 cursor-pointer transition-colors ${
                  formData.type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('type', type.value)}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={() => handleInputChange('type', type.value)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Trigger Event *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TRIGGER_TYPES.map((trigger) => (
              <Card
                key={trigger.value}
                className={`p-3 cursor-pointer transition-colors ${
                  formData.trigger === trigger.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('trigger', trigger.value)}
              >
                <div className="flex items-start">
                  <input
                    type="radio"
                    name="trigger"
                    value={trigger.value}
                    checked={formData.trigger === trigger.value}
                    onChange={() => handleInputChange('trigger', trigger.value)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-sm">{trigger.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{trigger.description}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delay (minutes)
          </label>
          <Input
            type="number"
            value={formData.delay}
            onChange={(e) => handleInputChange('delay', parseInt(e.target.value) || 0)}
            min="0"
            placeholder="0"
            error={errors.delay}
          />
          <p className="text-xs text-gray-500 mt-1">
            How long to wait after the trigger event before sending the email
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Template
          </label>
          <select
            value={formData.templateId}
            onChange={(e) => handleInputChange('templateId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="price_alert">Price Alert Template</option>
            <option value="deal_notification">Deal Notification Template</option>
            <option value="welcome">Welcome Template</option>
            <option value="newsletter">Newsletter Template</option>
          </select>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Conditions</h4>
            <p className="text-sm text-gray-600 mb-3">
              Set conditions for when this campaign should trigger (coming soon)
            </p>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="condition-price"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled
                />
                <label htmlFor="condition-price" className="ml-2 text-sm text-gray-500">
                  Only for products above $50
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="condition-category"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  disabled
                />
                <label htmlFor="condition-category" className="ml-2 text-sm text-gray-500">
                  Only for specific categories
                </label>
              </div>
            </div>
          </div>
        </div>
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
          {campaign ? 'Update' : 'Create'} Campaign
        </Button>
      </div>
    </form>
  )
}