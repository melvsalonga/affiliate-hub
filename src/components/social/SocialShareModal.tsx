'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface SocialShareModalProps {
  type: 'product' | 'deal'
  itemId: string
  item: any
  onClose: () => void
}

const SOCIAL_PLATFORMS = [
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    color: 'bg-blue-500',
    description: 'Share with your Twitter followers',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600',
    description: 'Post to your Facebook page',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'bg-blue-700',
    description: 'Share with your professional network',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'bg-pink-500',
    description: 'Share to Instagram (coming soon)',
    disabled: true,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: 'bg-red-500',
    description: 'Pin to Pinterest (coming soon)',
    disabled: true,
  },
]

export function SocialShareModal({ type, itemId, item, onClose }: SocialShareModalProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    // Generate default message based on item type
    const defaultMessage = generateDefaultMessage(type, item)
    setCustomMessage(defaultMessage)
  }, [type, item])

  const generateDefaultMessage = (type: string, item: any) => {
    if (type === 'product') {
      const price = item.currentPrice ? `${item.currency || '$'}${item.currentPrice}` : ''
      const discount = item.originalPrice && item.currentPrice < item.originalPrice
        ? ` (${Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100)}% OFF!)`
        : ''
      
      return `🛍️ Check out ${item.title}${price ? ` for ${price}` : ''}${discount} #Deal #Shopping #Affiliate`
    } else {
      const discount = item.discountPercent ? `${item.discountPercent}% OFF` : 'Special Deal'
      const price = item.salePrice ? `${item.currency || '$'}${item.salePrice}` : ''
      const originalPrice = item.originalPrice ? ` (was ${item.currency || '$'}${item.originalPrice})` : ''
      
      return `🔥 ${discount}! ${item.title}${price ? ` now ${price}` : ''}${originalPrice}! Limited time offer! #DealAlert #Sale #Discount`
    }
  }

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    )
  }

  const handleShare = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform to share to.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/social-media/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          itemId,
          platforms: selectedPlatforms,
          customMessage: customMessage.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setResults(data.data.results)
      } else {
        alert(data.message || 'Failed to share to social media')
      }
    } catch (error) {
      console.error('Share error:', error)
      alert('Failed to share to social media')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${type === 'product' ? 'products' : 'deals'}/${item.slug}`
    navigator.clipboard.writeText(url)
    alert('Link copied to clipboard!')
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Successfully Shared!
          </h3>
          <p className="text-gray-600">
            Your {type} has been shared to {results.filter(r => r.success).length} platform(s).
          </p>
        </div>

        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <span className="font-medium">{result.provider}</span>
              <Badge className={result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Item Preview */}
      <Card className="p-4">
        <div className="flex items-start space-x-4">
          {item.images?.[0]?.url && (
            <img
              src={item.images[0].url}
              alt={item.title}
              className="w-16 h-16 object-cover rounded-lg"
            />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {type === 'product' ? 'Product' : 'Deal'}
            </p>
            {item.currentPrice && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="font-bold text-green-600">
                  {item.currency || '$'}{item.currentPrice}
                </span>
                {item.originalPrice && item.originalPrice > item.currentPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    {item.currency || '$'}{item.originalPrice}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Platform Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Platforms
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCIAL_PLATFORMS.map((platform) => (
            <Card
              key={platform.id}
              className={`p-3 cursor-pointer transition-colors ${
                platform.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : selectedPlatforms.includes(platform.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => !platform.disabled && handlePlatformToggle(platform.id)}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full ${platform.color} flex items-center justify-center text-white text-sm`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{platform.name}</div>
                  <div className="text-xs text-gray-500">{platform.description}</div>
                </div>
                {!platform.disabled && (
                  <input
                    type="checkbox"
                    checked={selectedPlatforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Custom Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Custom Message
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Enter your custom message..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Customize your message or leave as is for the default message.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleCopyLink}
        >
          Copy Link
        </Button>
        
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            loading={loading}
            disabled={selectedPlatforms.length === 0}
          >
            Share Now
          </Button>
        </div>
      </div>
    </div>
  )
}