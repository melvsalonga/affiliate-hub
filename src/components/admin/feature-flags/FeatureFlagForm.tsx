'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface FeatureFlagFormProps {
  flag?: any
  onSave: () => void
  onCancel: () => void
}

const FLAG_TYPES = [
  { value: 'boolean', label: 'Boolean', description: 'True/false value' },
  { value: 'string', label: 'String', description: 'Text value' },
  { value: 'number', label: 'Number', description: 'Numeric value' },
  { value: 'json', label: 'JSON', description: 'Complex object value' },
]

export function FeatureFlagForm({ flag, onSave, onCancel }: FeatureFlagFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    type: 'boolean',
    value: '',
    defaultValue: '',
    isActive: true,
    rolloutPercentage: 100,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (flag) {
      setFormData({
        name: flag.name || '',
        key: flag.key || '',
        description: flag.description || '',
        type: flag.type || 'boolean',
        value: flag.type === 'json' ? JSON.stringify(flag.value, null, 2) : String(flag.value || ''),
        defaultValue: flag.type === 'json' ? JSON.stringify(flag.defaultValue, null, 2) : String(flag.defaultValue || ''),
        isActive: flag.isActive ?? true,
        rolloutPercentage: flag.rolloutPercentage || 100,
      })
    }
  }, [flag])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const generateKeyFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
  }

  const parseValue = (value: string, type: string) => {
    switch (type) {
      case 'boolean':
        return value === 'true' || value === '1'
      case 'number':
        return parseFloat(value) || 0
      case 'json':
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      default:
        return value
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.key.trim()) {
      newErrors.key = 'Key is required'
    } else if (!/^[a-z0-9_]+$/.test(formData.key)) {
      newErrors.key = 'Key must contain only lowercase letters, numbers, and underscores'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.type === 'json') {
      try {
        JSON.parse(formData.value)
      } catch {
        newErrors.value = 'Invalid JSON format'
      }
      
      try {
        JSON.parse(formData.defaultValue)
      } catch {
        newErrors.defaultValue = 'Invalid JSON format'
      }
    }

    if (formData.rolloutPercentage < 0 || formData.rolloutPercentage > 100) {
      newErrors.rolloutPercentage = 'Rollout percentage must be between 0 and 100'
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
      const payload = {
        name: formData.name.trim(),
        key: formData.key.trim(),
        description: formData.description.trim(),
        type: formData.type,
        value: parseValue(formData.value, formData.type),
        defaultValue: parseValue(formData.defaultValue, formData.type),
        isActive: formData.isActive,
        rolloutPercentage: formData.rolloutPercentage,
      }

      const url = flag ? `/api/feature-flags/${flag.key}` : '/api/feature-flags'
      const method = flag ? 'PUT' : 'POST'

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
        setErrors({ submit: data.error || 'Failed to save feature flag' })
      }
    } catch (error) {
      setErrors({ submit: 'Failed to save feature flag' })
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
            onChange={(e) => {
              handleInputChange('name', e.target.value)
              if (!flag) {
                handleInputChange('key', generateKeyFromName(e.target.value))
              }
            }}
            placeholder="Enter feature flag name"
            error={errors.name}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key *
          </label>
          <Input
            value={formData.key}
            onChange={(e) => handleInputChange('key', e.target.value)}
            placeholder="feature_flag_key"
            error={errors.key}
            disabled={!!flag}
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for this feature flag (lowercase, numbers, underscores only)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe what this feature flag controls"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description}</p>
          )}
        </div>
      </div>

      {/* Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Type *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FLAG_TYPES.map((type) => (
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

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value *
          </label>
          {formData.type === 'json' ? (
            <textarea
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder='{"key": "value"}'
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
            />
          ) : formData.type === 'boolean' ? (
            <select
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </select>
          ) : (
            <Input
              value={formData.value}
              onChange={(e) => handleInputChange('value', e.target.value)}
              placeholder={formData.type === 'number' ? '0' : 'Enter value'}
              type={formData.type === 'number' ? 'number' : 'text'}
            />
          )}
          {errors.value && (
            <p className="text-red-500 text-sm mt-1">{errors.value}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Default Value *
          </label>
          {formData.type === 'json' ? (
            <textarea
              value={formData.defaultValue}
              onChange={(e) => handleInputChange('defaultValue', e.target.value)}
              placeholder='{}'
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              rows={4}
            />
          ) : formData.type === 'boolean' ? (
            <select
              value={formData.defaultValue}
              onChange={(e) => handleInputChange('defaultValue', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="false">False</option>
              <option value="true">True</option>
            </select>
          ) : (
            <Input
              value={formData.defaultValue}
              onChange={(e) => handleInputChange('defaultValue', e.target.value)}
              placeholder={formData.type === 'number' ? '0' : 'Enter default value'}
              type={formData.type === 'number' ? 'number' : 'text'}
            />
          )}
          {errors.defaultValue && (
            <p className="text-red-500 text-sm mt-1">{errors.defaultValue}</p>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rollout Percentage
          </label>
          <Input
            type="number"
            value={formData.rolloutPercentage}
            onChange={(e) => handleInputChange('rolloutPercentage', parseInt(e.target.value) || 0)}
            min="0"
            max="100"
            error={errors.rolloutPercentage}
          />
          <p className="text-xs text-gray-500 mt-1">
            Percentage of users who will see this feature (0-100)
          </p>
        </div>

        <div className="flex items-center space-x-2 pt-6">
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
          {flag ? 'Update' : 'Create'} Feature Flag
        </Button>
      </div>
    </form>
  )
}