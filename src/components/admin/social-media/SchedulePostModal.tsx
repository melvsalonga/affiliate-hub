'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

interface SchedulePostModalProps {
  onClose: () => void
  onScheduled: () => void
}

const SOCIAL_PLATFORMS = [
  { id: 'twitter', name: 'Twitter', icon: '🐦', maxLength: 280 },
  { id: 'facebook', name: 'Facebook', icon: '📘', maxLength: 63206 },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', maxLength: 3000 },
  { id: 'instagram', name: 'Instagram', icon: '📷', maxLength: 2200, disabled: true },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', maxLength: 500, disabled: true },
]

interface PostTemplate {
  id: string
  name: string
  type: string
  content: string
  hashtags: string[]
}

export function SchedulePostModal({ onClose, onScheduled }: SchedulePostModalProps) {
  const [formData, setFormData] = useState({
    content: '',
    platforms: [] as string[],
    scheduledAt: '',
    hashtags: [] as string[],
    mediaUrls: [] as string[],
  })
  const [templates, setTemplates] = useState<PostTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchTemplates()
    
    // Set default scheduled time to 1 hour from now
    const defaultTime = new Date()
    defaultTime.setHours(defaultTime.getHours() + 1)
    setFormData(prev => ({
      ...prev,
      scheduledAt: defaultTime.toISOString().slice(0, 16)
    }))
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/social-media/templates')
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePlatformToggle = (platformId: string) => {
    const newPlatforms = formData.platforms.includes(platformId)
      ? formData.platforms.filter(id => id !== platformId)
      : [...formData.platforms, platformId]
    
    handleInputChange('platforms', newPlatforms)
  }

  const handleTemplateSelect = (template: PostTemplate) => {
    setFormData(prev => ({
      ...prev,
      content: template.content,
      hashtags: template.hashtags,
    }))
  }

  const handleHashtagAdd = (hashtag: string) => {
    if (hashtag && !formData.hashtags.includes(hashtag)) {
      handleInputChange('hashtags', [...formData.hashtags, hashtag])
    }
  }

  const handleHashtagRemove = (hashtag: string) => {
    handleInputChange('hashtags', formData.hashtags.filter(h => h !== hashtag))
  }

  const getCharacterCount = () => {
    const selectedPlatforms = SOCIAL_PLATFORMS.filter(p => formData.platforms.includes(p.id))
    if (selectedPlatforms.length === 0) return null
    
    const minLimit = Math.min(...selectedPlatforms.map(p => p.maxLength))
    const currentLength = formData.content.length
    
    return {
      current: currentLength,
      max: minLimit,
      remaining: minLimit - currentLength,
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.content.trim()) {
      newErrors.content = 'Post content is required'
    }

    if (formData.platforms.length === 0) {
      newErrors.platforms = 'At least one platform must be selected'
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'Scheduled time is required'
    } else {
      const scheduledTime = new Date(formData.scheduledAt)
      if (scheduledTime <= new Date()) {
        newErrors.scheduledAt = 'Scheduled time must be in the future'
      }
    }

    const charCount = getCharacterCount()
    if (charCount && charCount.remaining < 0) {
      newErrors.content = `Content exceeds character limit by ${Math.abs(charCount.remaining)} characters`
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
      const response = await fetch('/api/social-media/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: formData.content.trim(),
          platforms: formData.platforms,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          hashtags: formData.hashtags,
          mediaUrls: formData.mediaUrls,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onScheduled()
      } else {
        setErrors({ submit: data.error || 'Failed to schedule post' })
      }
    } catch (error) {
      setErrors({ submit: 'Failed to schedule post' })
    } finally {
      setLoading(false)
    }
  }

  const charCount = getCharacterCount()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Templates */}
      {templates.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Platforms {errors.platforms && <span className="text-red-500 text-sm">({errors.platforms})</span>}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <Card
              key={platform.id}
              className={`p-3 cursor-pointer transition-colors ${
                platform.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : formData.platforms.includes(platform.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !platform.disabled && handlePlatformToggle(platform.id)}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{platform.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{platform.name}</div>
                  <div className="text-xs text-gray-500">
                    {platform.maxLength.toLocaleString()} chars
                  </div>
                </div>
                {!platform.disabled && (
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Post Content */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Post Content *
          </label>
          {charCount && (
            <span className={`text-xs ${charCount.remaining < 0 ? 'text-red-500' : 'text-gray-500'}`}>
              {charCount.current}/{charCount.max} characters
            </span>
          )}
        </div>
        <textarea
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.content ? 'border-red-300' : 'border-gray-300'
          }`}
          rows={6}
          placeholder="What would you like to share?"
        />
        {errors.content && (
          <p className="text-red-500 text-sm mt-1">{errors.content}</p>
        )}
      </div>

      {/* Hashtags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hashtags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.hashtags.map((hashtag) => (
            <span
              key={hashtag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
            >
              #{hashtag}
              <button
                type="button"
                onClick={() => handleHashtagRemove(hashtag)}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <Input
          placeholder="Add hashtag (without #)"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const input = e.target as HTMLInputElement
              handleHashtagAdd(input.value.trim())
              input.value = ''
            }
          }}
        />
      </div>

      {/* Scheduled Time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Schedule For *
        </label>
        <Input
          type="datetime-local"
          value={formData.scheduledAt}
          onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
          error={errors.scheduledAt}
        />
      </div>

      {/* Media URLs (Future Enhancement) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Media URLs (Optional)
        </label>
        <Input
          placeholder="Add image or video URLs (coming soon)"
          disabled
        />
        <p className="text-xs text-gray-500 mt-1">
          Media upload functionality will be available in a future update.
        </p>
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
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          loading={loading}
        >
          Schedule Post
        </Button>
      </div>
    </form>
  )
}